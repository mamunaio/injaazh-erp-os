import { soundSettings, SoundCategory, SOUND_STORAGE_KEYS } from './soundSettings';

export { soundSettings, SOUND_STORAGE_KEYS };
export type { SoundCategory, SoundSettings } from './soundSettings';

let sharedAudioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let isVolumeSubscribed = false;

// In-memory decoded AudioBuffer cache for instant sub-5ms acoustic playback
const sampleBufferCache = new Map<string, AudioBuffer>();
const pendingFetches = new Map<string, Promise<AudioBuffer | null>>();

const ensureVolumeSubscription = () => {
  if (isVolumeSubscribed) return;
  isVolumeSubscribed = true;
  soundSettings.subscribeSoundSettings((settings) => {
    if (sharedAudioCtx && masterGainNode) {
      try {
        const vol = Math.max(0, Math.min(1, settings.masterVolume / 100));
        masterGainNode.gain.setValueAtTime(vol, sharedAudioCtx.currentTime);
      } catch {}
    }
  });
};

export const ALL_SAMPLE_NAMES = [
  'notification',
  'login1', 'login2', 'login3',
  'edit1', 'edit2', 'edit3',
  'success1', 'success2', 'success3',
  'income1', 'income2', 'income3',
  'expense1', 'expense2', 'expense3',
  'delete1', 'delete2', 'delete3',
  'mailSend1', 'mailSend2', 'mailSend3',
  'error1', 'error2', 'error3',
  'click', 'pop'
] as const;

export const loadSampleBuffer = async (ctx: AudioContext, soundName: string): Promise<AudioBuffer | null> => {
  if (sampleBufferCache.has(soundName)) {
    return sampleBufferCache.get(soundName)!;
  }
  if (pendingFetches.has(soundName)) {
    return pendingFetches.get(soundName)!;
  }

  const fetchPromise = (async () => {
    try {
      if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
      const res = await fetch(`/sounds/${soundName}.wav`);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();

      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        if (typeof ctx.decodeAudioData === 'function') {
          ctx.decodeAudioData(arrayBuffer, resolve, reject);
        } else {
          resolve({} as AudioBuffer);
        }
      });

      sampleBufferCache.set(soundName, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    } finally {
      pendingFetches.delete(soundName);
    }
  })();

  pendingFetches.set(soundName, fetchPromise);
  return fetchPromise;
};

export const preloadAllSamples = async (): Promise<void> => {
  const audio = getAudioContext();
  if (!audio || !audio.ctx) return;
  const ctx = audio.ctx;
  await Promise.all(ALL_SAMPLE_NAMES.map((name) => loadSampleBuffer(ctx, name)));
};

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      if (!sharedAudioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          sharedAudioCtx = new AudioContextClass();
        }
      }
      if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
      }
      // Play a 1-sample silent buffer to unlock audio hardware on iOS / WebKit / Blink immediately
      if (sharedAudioCtx) {
        const buffer = sharedAudioCtx.createBuffer(1, 1, 22050);
        const source = sharedAudioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(sharedAudioCtx.destination);
        source.start(0);

        // Preload all acoustic audio buffers in background for zero-latency subsequent playback
        preloadAllSamples().catch(() => {});
      }
    } catch {}
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('mousedown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  window.addEventListener('mousedown', unlockAudio, { once: true, passive: true });
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

  ensureVolumeSubscription();
}

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  ensureVolumeSubscription();

  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && !masterGainNode) {
    masterGainNode = sharedAudioCtx.createGain();
    const currentVol = Math.max(0, Math.min(1, soundSettings.getMasterVolume() / 100));
    masterGainNode.gain.setValueAtTime(currentVol, sharedAudioCtx.currentTime);
    masterGainNode.connect(sharedAudioCtx.destination);
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return { ctx: sharedAudioCtx, dest: masterGainNode || sharedAudioCtx?.destination };
};

// Rate limiter timestamps to prevent audio pileups
const lastSoundTimestamps: Record<string, number> = {};

const checkRateLimit = (key: string, cooldownMs: number): boolean => {
  const now = Date.now();
  const last = lastSoundTimestamps[key] || 0;
  if (now - last < cooldownMs) {
    return false;
  }
  lastSoundTimestamps[key] = now;
  return true;
};

// Procedural fallback synthesis: ADSR envelope with gentle low-pass warmth filter
const playRichTone = (
  freq: number,
  type: OscillatorType = 'sine',
  attack: number = 0.008,
  decay: number = 0.08,
  sustain: number = 0.4,
  release: number = 0.4,
  vol: number = 0.25,
  detuneSpread: number = 0,
  sweepFreq?: number,
  sweepTime?: number,
  delayOffset: number = 0,
  category?: SoundCategory,
  filterFreq: number = 3200
) => {
  try {
    if (!soundSettings.isSoundAllowed(category)) return;

    const audio = getAudioContext();
    if (!audio || !audio.ctx || !audio.dest) return;
    const { ctx, dest } = audio;

    const startTime = ctx.currentTime + Math.max(0, delayOffset);
    const duration = attack + decay + release;

    const gain = ctx.createGain();
    gain.connect(dest);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, vol), startTime + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * sustain), startTime + attack + decay);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay + release);

    let filterNode: BiquadFilterNode | null = null;
    if (filterFreq > 0 && typeof ctx.createBiquadFilter === 'function') {
      try {
        filterNode = ctx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(filterFreq, startTime);
        filterNode.Q.setValueAtTime(1.0, startTime);
        filterNode.connect(gain);
      } catch {
        filterNode = null;
      }
    }

    const inputNode: AudioNode = filterNode || gain;
    const oscs: OscillatorNode[] = [];
    const createOsc = (detune: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      if (detune !== 0) {
        osc.detune.setValueAtTime(detune, startTime);
      }

      if (sweepFreq && sweepTime) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepFreq), startTime + sweepTime);
      }

      osc.connect(inputNode);
      osc.start(startTime);
      const stopTime = startTime + duration + 0.05;
      osc.stop(stopTime);
      oscs.push(osc);
    };

    createOsc(0);
    if (detuneSpread > 0) {
      createOsc(detuneSpread);
      createOsc(-detuneSpread);
    }

    let endedCount = 0;
    const totalOscs = oscs.length;
    const cleanupNodes = () => {
      try {
        gain.disconnect();
        if (filterNode) filterNode.disconnect();
      } catch {}
    };

    oscs.forEach((osc) => {
      osc.onended = () => {
        try {
          osc.disconnect();
        } catch {}
        endedCount++;
        if (endedCount >= totalOscs) {
          cleanupNodes();
        }
      };
    });

    const fallbackMs = Math.max(100, Math.ceil((startTime - ctx.currentTime + duration + 0.15) * 1000));
    setTimeout(() => {
      oscs.forEach((osc) => {
        try {
          osc.disconnect();
        } catch {}
      });
      cleanupNodes();
    }, fallbackMs);
  } catch {}
};

const playChord = (
  frequencies: number[],
  type: OscillatorType = 'sine',
  release: number = 0.9,
  vol: number = 0.22,
  delayOffset: number = 0,
  category?: SoundCategory,
  staggerMs: number = 0,
  filterFreq: number = 2400
) => {
  frequencies.forEach((freq, idx) => {
    const offset = delayOffset + (idx * staggerMs) / 1000;
    playRichTone(
      freq,
      type,
      0.015,
      0.12,
      0.5,
      release,
      vol / Math.sqrt(frequencies.length),
      0,
      undefined,
      undefined,
      offset,
      category,
      filterFreq
    );
  });
};

// Primary Unified AudioBuffer Dispatcher with Seamless Procedural Fallback
const playSample = (
  sampleName: string,
  category: SoundCategory,
  soundKey: string,
  cooldownMs: number,
  fallbackFn: () => void,
  volMultiplier: number = 1.0
) => {
  if (!soundSettings.isSoundAllowed(category)) return;
  if (!checkRateLimit(soundKey, cooldownMs)) return;

  const audio = getAudioContext();
  if (!audio || !audio.ctx || !audio.dest) {
    try { fallbackFn(); } catch {}
    return;
  }

  const { ctx, dest } = audio;
  const cached = sampleBufferCache.get(sampleName);

  if (cached) {
    try {
      const source = ctx.createBufferSource();
      source.buffer = cached;

      let targetNode: AudioNode = dest;
      if (volMultiplier !== 1.0 && typeof ctx.createGain === 'function') {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volMultiplier, ctx.currentTime);
        gain.connect(dest);
        targetNode = gain;
      }

      source.connect(targetNode);
      source.onended = () => {
        try {
          source.disconnect();
          if (targetNode !== dest) (targetNode as GainNode).disconnect();
        } catch {}
      };

      if (typeof source.start === 'function') {
        source.start(0);
      }
      return;
    } catch {
      try { fallbackFn(); } catch {}
      return;
    }
  }

  // If not cached yet, initiate background load and execute procedural fallback for responsive feedback
  loadSampleBuffer(ctx, sampleName).catch(() => {});
  try { fallbackFn(); } catch {}
};

// Retrieve setting choice with seamless legacy key backward compatibility
const getChoice = (primaryKey: string, legacyKey: string | null, defaultChoice: string): string => {
  if (typeof window === 'undefined') return defaultChoice;
  try {
    const primary = localStorage.getItem(primaryKey);
    if (primary) return primary;

    if (legacyKey) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        // Migrate to primary key without resetting user preferences
        try { localStorage.setItem(primaryKey, legacy); } catch {}
        return legacy;
      }
    }
    return defaultChoice;
  } catch {
    return defaultChoice;
  }
};

export const sounds = {
  // ── 1. NOTIFICATION: Warm delicate crystal glass dual chime ──
  notification: () => {
    playSample('notification', 'notification', 'notification', 150, () => {
      playRichTone(880.00, 'sine', 0.006, 0.06, 0.35, 0.36, 0.22, 0, undefined, undefined, 0, 'notification', 2800);
      playRichTone(1318.51, 'sine', 0.006, 0.08, 0.40, 0.48, 0.24, 0, undefined, undefined, 0.065, 'notification', 2800);
      playRichTone(1760.00, 'sine', 0.008, 0.04, 0.20, 0.25, 0.06, 0, undefined, undefined, 0.065, 'notification', 2400);
    });
  },

  // ── 2. SYSTEM BOOT / LOGIN: Gentle harmonic swells ──
  login1: () => {
    playSample('login1', 'systemBoot', 'login', 150, () => {
      const fMaj9 = [174.61, 261.63, 329.63, 440.00, 523.25];
      playChord(fMaj9, 'sine', 1.1, 0.26, 0, 'systemBoot', 25, 1800);
    });
  },
  login2: () => {
    playSample('login2', 'systemBoot', 'login', 150, () => {
      const chord = [207.65, 261.63, 311.13, 392.00];
      playChord(chord, 'sine', 1.0, 0.24, 0, 'systemBoot', 45, 1600);
    });
  },
  login3: () => {
    playSample('login3', 'systemBoot', 'login', 150, () => {
      playRichTone(293.66, 'sine', 0.02, 0.15, 0.4, 0.9, 0.16, 0, undefined, undefined, 0, 'systemBoot', 1800);
      playRichTone(440.00, 'sine', 0.02, 0.15, 0.4, 0.9, 0.16, 0, undefined, undefined, 0.04, 'systemBoot', 1800);
      playRichTone(739.99, 'sine', 0.01, 0.10, 0.3, 1.0, 0.18, 0, undefined, undefined, 0.12, 'systemBoot', 2200);
    });
  },
  login: () => {
    const choice = getChoice('sound_systemBoot', null, 'login1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.login1();
    }
  },

  // ── 3. EDIT / SAVE: Tactile rosewood marimba taps ──
  edit1: () => {
    playSample('edit1', 'notification', 'edit', 150, () => {
      playRichTone(440.00, 'sine', 0.004, 0.05, 0.3, 0.14, 0.24, 0, undefined, undefined, 0, 'notification', 2200);
      playRichTone(659.25, 'sine', 0.004, 0.06, 0.3, 0.18, 0.22, 0, undefined, undefined, 0.045, 'notification', 2200);
    });
  },
  edit2: () => {
    playSample('edit2', 'notification', 'edit', 150, () => {
      playRichTone(523.25, 'sine', 0.004, 0.04, 0.2, 0.14, 0.25, 0, 505, 0.08, 0, 'notification', 2000);
    });
  },
  edit3: () => {
    playSample('edit3', 'notification', 'edit', 150, () => {
      playRichTone(392.00, 'sine', 0.005, 0.06, 0.25, 0.16, 0.18, 0, undefined, undefined, 0, 'notification', 2000);
      playRichTone(493.88, 'sine', 0.005, 0.06, 0.25, 0.16, 0.18, 0, undefined, undefined, 0.02, 'notification', 2000);
    });
  },
  edit: () => {
    const choice = getChoice('sound_edit', 'sound_newLead', 'edit1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.edit1();
    }
  },

  // ── 4. SUCCESS: Ascending crystal champagne shimmer chimes ──
  success1: () => {
    playSample('success1', 'notification', 'success', 150, () => {
      playRichTone(659.25, 'sine', 0.006, 0.06, 0.35, 0.38, 0.20, 0, undefined, undefined, 0, 'notification', 3000);
      playRichTone(830.61, 'sine', 0.006, 0.06, 0.35, 0.42, 0.22, 0, undefined, undefined, 0.055, 'notification', 3000);
      playRichTone(987.77, 'sine', 0.006, 0.08, 0.40, 0.55, 0.25, 0, undefined, undefined, 0.11, 'notification', 3000);
    });
  },
  success2: () => {
    playSample('success2', 'notification', 'success', 150, () => {
      playRichTone(587.33, 'sine', 0.008, 0.06, 0.3, 0.35, 0.20, 0, undefined, undefined, 0, 'notification', 2600);
      playRichTone(739.99, 'sine', 0.008, 0.06, 0.3, 0.38, 0.22, 0, undefined, undefined, 0.06, 'notification', 2600);
      playRichTone(880.00, 'sine', 0.008, 0.08, 0.35, 0.48, 0.24, 0, undefined, undefined, 0.12, 'notification', 2600);
    });
  },
  success3: () => {
    playSample('success3', 'notification', 'success', 150, () => {
      const glassChord = [554.37, 830.61, 1108.73];
      playChord(glassChord, 'sine', 0.6, 0.24, 0, 'notification', 0, 2800);
    });
  },
  success: () => {
    const choice = getChoice('sound_success', 'sound_leadConverted', 'success1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.success1();
    }
  },

  // ── 5. PAYMENT RECEIVED / REVENUE: Refined metallic coin chimes ──
  income1: () => {
    playSample('income1', 'paymentReceived', 'income', 150, () => {
      playRichTone(1046.50, 'sine', 0.003, 0.06, 0.25, 0.40, 0.22, 0, undefined, undefined, 0, 'paymentReceived', 3200);
      playRichTone(1567.98, 'sine', 0.003, 0.07, 0.25, 0.45, 0.24, 0, undefined, undefined, 0.05, 'paymentReceived', 3200);
      playRichTone(2093.00, 'sine', 0.003, 0.03, 0.10, 0.20, 0.05, 0, undefined, undefined, 0.08, 'paymentReceived', 2800);
    });
  },
  income2: () => {
    playSample('income2', 'paymentReceived', 'income', 150, () => {
      playRichTone(880.00, 'sine', 0.004, 0.05, 0.2, 0.35, 0.22, 0, undefined, undefined, 0, 'paymentReceived', 2800);
      playRichTone(1318.51, 'sine', 0.004, 0.06, 0.2, 0.40, 0.24, 0, undefined, undefined, 0.04, 'paymentReceived', 2800);
    });
  },
  income3: () => {
    playSample('income3', 'paymentReceived', 'income', 150, () => {
      playRichTone(1174.66, 'sine', 0.004, 0.06, 0.2, 0.45, 0.20, 0, undefined, undefined, 0, 'paymentReceived', 3000);
      playRichTone(1479.98, 'sine', 0.004, 0.06, 0.2, 0.45, 0.22, 0, undefined, undefined, 0.03, 'paymentReceived', 3000);
    });
  },
  income: () => {
    const choice = getChoice('sound_paymentReceived', null, 'income1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.income1();
    }
  },

  // ── 6. EXPENSE: Soft low-frequency wooden debit thuds ──
  expense1: () => {
    playSample('expense1', 'expenseLogged', 'expense', 150, () => {
      playRichTone(220.00, 'sine', 0.004, 0.05, 0.25, 0.14, 0.24, 0, 160, 0.06, 0, 'expenseLogged', 800);
    });
  },
  expense2: () => {
    playSample('expense2', 'expenseLogged', 'expense', 150, () => {
      playRichTone(230.00, 'sine', 0.004, 0.04, 0.2, 0.10, 0.22, 0, undefined, undefined, 0, 'expenseLogged', 750);
      playRichTone(180.00, 'sine', 0.004, 0.04, 0.2, 0.12, 0.22, 0, undefined, undefined, 0.035, 'expenseLogged', 750);
    });
  },
  expense3: () => {
    playSample('expense3', 'expenseLogged', 'expense', 150, () => {
      playRichTone(196.00, 'sine', 0.004, 0.03, 0.15, 0.10, 0.22, 0, 155, 0.05, 0, 'expenseLogged', 700);
    });
  },
  expense: () => {
    const choice = getChoice('sound_expenseLogged', null, 'expense1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.expense1();
    }
  },

  // ── 7. DELETE: Subtle organic muted wooden pops ──
  delete1: () => {
    playSample('delete1', 'itemDeleted', 'delete', 150, () => {
      playRichTone(320.00, 'sine', 0.002, 0.025, 0.15, 0.045, 0.24, 0, 180, 0.035, 0, 'itemDeleted', 1200);
    });
  },
  delete2: () => {
    playSample('delete2', 'itemDeleted', 'delete', 150, () => {
      playRichTone(280.00, 'sine', 0.002, 0.02, 0.1, 0.04, 0.22, 0, 140, 0.03, 0, 'itemDeleted', 1000);
    });
  },
  delete3: () => {
    playSample('delete3', 'itemDeleted', 'delete', 150, () => {
      playRichTone(220.00, 'sine', 0.002, 0.02, 0.1, 0.04, 0.20, 0, undefined, undefined, 0, 'itemDeleted', 1100);
      playRichTone(160.00, 'sine', 0.002, 0.02, 0.1, 0.04, 0.20, 0, undefined, undefined, 0.015, 'itemDeleted', 1100);
    });
  },
  delete: () => {
    const choice = getChoice('sound_itemDeleted', null, 'delete1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.delete1();
    }
  },

  // ── 8. EMAIL SENT: Gentle aerodynamic air sweeps ──
  mailSend1: () => {
    playSample('mailSend1', 'emailSent', 'mailSend', 150, () => {
      playRichTone(460.00, 'sine', 0.025, 0.09, 0.3, 0.12, 0.18, 0, 880, 0.16, 0, 'emailSent', 1600);
    });
  },
  mailSend2: () => {
    playSample('mailSend2', 'emailSent', 'mailSend', 150, () => {
      playRichTone(520.00, 'sine', 0.02, 0.08, 0.25, 0.11, 0.18, 0, 980, 0.14, 0, 'emailSent', 1500);
    });
  },
  mailSend3: () => {
    playSample('mailSend3', 'emailSent', 'mailSend', 150, () => {
      playRichTone(420.00, 'sine', 0.02, 0.08, 0.2, 0.12, 0.14, 0, 840, 0.15, 0, 'emailSent', 1600);
      playRichTone(700.00, 'sine', 0.02, 0.06, 0.15, 0.10, 0.08, 0, 1400, 0.14, 0.025, 'emailSent', 1800);
    });
  },
  mailSend: () => {
    const choice = getChoice('sound_emailSent', null, 'mailSend1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.mailSend1();
    }
  },

  // ── 9. ERROR ALERT: Restrained acoustic dual-tone warning ──
  error1: () => {
    playSample('error1', 'errorAlert', 'error', 150, () => {
      playRichTone(349.23, 'sine', 0.008, 0.06, 0.35, 0.14, 0.18, 0, undefined, undefined, 0, 'errorAlert', 1200);
      playRichTone(293.66, 'sine', 0.008, 0.08, 0.35, 0.20, 0.20, 0, undefined, undefined, 0.075, 'errorAlert', 1200);
    });
  },
  error2: () => {
    playSample('error2', 'errorAlert', 'error', 150, () => {
      playRichTone(261.63, 'sine', 0.006, 0.04, 0.3, 0.06, 0.18, 0, undefined, undefined, 0, 'errorAlert', 1100);
      playRichTone(261.63, 'sine', 0.006, 0.05, 0.3, 0.10, 0.18, 0, undefined, undefined, 0.07, 'errorAlert', 1100);
    });
  },
  error3: () => {
    playSample('error3', 'errorAlert', 'error', 150, () => {
      playRichTone(293.66, 'sine', 0.015, 0.08, 0.3, 0.22, 0.14, 0, undefined, undefined, 0, 'errorAlert', 1000);
      playRichTone(349.23, 'sine', 0.015, 0.08, 0.3, 0.22, 0.14, 0, undefined, undefined, 0, 'errorAlert', 1000);
    });
  },
  error: () => {
    const choice = getChoice('sound_errorAlert', null, 'error1');
    if ((sounds as any)[choice]) {
      (sounds as any)[choice]();
    } else {
      sounds.error1();
    }
  },

  // ── 10. TACTILE UI FEEDBACK: Micro-switch clicks and dock ticks ──
  pop: () => {
    playSample('pop', 'uiClicks', 'pop', 40, () => {
      playRichTone(580.00, 'sine', 0.002, 0.014, 0.1, 0.018, 0.09, 0, 750, 0.012, 0, 'uiClicks', 1800);
    });
  },
  click: () => {
    playSample('click', 'uiClicks', 'click', 40, () => {
      playRichTone(460.00, 'triangle', 0.002, 0.012, 0.1, 0.016, 0.08, 0, 360, 0.010, 0, 'uiClicks', 1600);
    });
  }
};

// Internal testing utilities for unit test verification
export const _testing = {
  getSharedAudioContext: () => sharedAudioCtx,
  getMasterGainNode: () => masterGainNode,
  getSampleBufferCache: () => sampleBufferCache,
  setSampleBuffer: (name: string, buffer: AudioBuffer) => {
    sampleBufferCache.set(name, buffer);
  },
  clearSampleBufferCache: () => {
    sampleBufferCache.clear();
  },
  loadSampleBuffer,
  preloadAllSamples,
  resetAudioContext: () => {
    sharedAudioCtx = null;
    masterGainNode = null;
    isVolumeSubscribed = false;
    sampleBufferCache.clear();
    ensureVolumeSubscription();
  },
  resetRateLimiter: () => {
    for (const key of Object.keys(lastSoundTimestamps)) {
      delete lastSoundTimestamps[key];
    }
  },
  getLastSoundTimestamps: () => ({ ...lastSoundTimestamps })
};
