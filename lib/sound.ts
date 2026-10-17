let sharedAudioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;

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
      }
    } catch (e) {}
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
}

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && !masterGainNode) {
    masterGainNode = sharedAudioCtx.createGain();
    masterGainNode.gain.value = 0.85;
    masterGainNode.connect(sharedAudioCtx.destination);
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return { ctx: sharedAudioCtx, dest: masterGainNode || sharedAudioCtx?.destination };
};

// Advanced tone generator with ADSR and Detune (Chorus effect) - 3ms micro-ramp for absolute zero latency
const playRichTone = (
  freq: number, 
  type: OscillatorType, 
  attack: number = 0.003,
  decay: number = 0.08,
  sustain: number = 0.5,
  release: number = 0.6,
  vol: number = 0.4, 
  detuneSpread: number = 6,
  sweepFreq?: number,
  sweepTime?: number,
  delayOffset: number = 0
) => {
  try {
    const audio = getAudioContext();
    if (!audio || !audio.ctx || !audio.dest) return;
    const { ctx, dest } = audio;

    const startTime = ctx.currentTime + Math.max(0, delayOffset);
    const duration = attack + decay + release;

    const gain = ctx.createGain();
    gain.connect(dest);
    
    // Sample-accurate ADSR Envelope scheduled on hardware timeline
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * sustain), startTime + attack + decay);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay + release);

    // Create unison oscillators for thick, studio-grade presence
    const createOsc = (detune: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime(detune, startTime);
      
      if (sweepFreq && sweepTime) {
        osc.frequency.exponentialRampToValueAtTime(sweepFreq, startTime + sweepTime);
      }
      
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };

    createOsc(0);           // Center
    if (detuneSpread > 0) {
      createOsc(detuneSpread); // Right detune
      createOsc(-detuneSpread);// Left detune
    }

  } catch (e) {}
};

const playChord = (frequencies: number[], type: OscillatorType, release: number = 1.2, vol: number = 0.25, delayOffset: number = 0) => {
  frequencies.forEach(freq => {
    playRichTone(freq, type, 0.005, 0.15, 0.6, release, vol / frequencies.length, 4, undefined, undefined, delayOffset);
  });
};

const getChoice = (key: string, defaultChoice: string) => {
  if (typeof window === 'undefined') return defaultChoice;
  return localStorage.getItem(key) || defaultChoice;
};

export const sounds = {
  // --- INSTANT NOTIFICATION CHIME (Executive crystal two-tone ding) ---
  notification: () => {
    // Tone 1: B5 (987.77 Hz) strikes at 0s
    playRichTone(987.77, 'sine', 0.003, 0.04, 0.3, 0.45, 0.35, 4, undefined, undefined, 0);
    // Tone 2: E6 (1318.51 Hz) strikes at 0.065s
    playRichTone(1318.51, 'sine', 0.003, 0.05, 0.4, 0.75, 0.4, 4, undefined, undefined, 0.065);
    // Harmonic sparkle overtone
    playRichTone(2637.02, 'sine', 0.003, 0.03, 0.2, 0.35, 0.1, 0, undefined, undefined, 0.065);
  },

  // --- SYSTEM BOOT / LOGIN ---
  login1: () => {
    playChord([261.63, 329.63, 392.00, 523.25], 'sine', 1.8, 0.35, 0); // Cmaj9
    playChord([349.23, 440, 523.25, 698.46], 'sine', 2.2, 0.3, 0.12);   // Fmaj9
  },
  login2: () => {
    playRichTone(440, 'sine', 0.01, 0.08, 0.5, 0.8, 0.2, 8, undefined, undefined, 0);
    playRichTone(554.37, 'sine', 0.01, 0.08, 0.5, 0.8, 0.2, 8, undefined, undefined, 0.12);
    playRichTone(659.25, 'triangle', 0.01, 0.08, 0.5, 2.0, 0.25, 8, undefined, undefined, 0.24);
  },
  login3: () => {
    playRichTone(1046.50, 'triangle', 0.01, 0.15, 0.4, 2.5, 0.2, 4, undefined, undefined, 0);
    playRichTone(1318.51, 'triangle', 0.01, 0.15, 0.4, 2.4, 0.15, 4, undefined, undefined, 0.15);
  },
  login: () => (sounds as any)[getChoice('sound_systemBoot', 'login1')](),

  // --- NEW LEAD ADDED / EDIT SAVED (Instant sparkling chimes) ---
  edit1: () => {
    playRichTone(1046.50, 'sine', 0.003, 0.06, 0.25, 0.7, 0.3, 4, undefined, undefined, 0);
    playRichTone(1567.98, 'sine', 0.003, 0.06, 0.25, 1.1, 0.25, 4, undefined, undefined, 0.065);
  },
  edit2: () => {
    playRichTone(880, 'triangle', 0.003, 0.08, 0.2, 0.45, 0.3, 0, 1760, 0.18, 0);
  },
  edit3: () => playChord([1046.50, 1318.51], 'sine', 0.8, 0.28, 0),
  edit: () => (sounds as any)[getChoice('sound_newLead', 'edit1')](),

  // --- LEAD CONVERTED / CLIENT WON (Triumphant instant arpeggio) ---
  success1: () => {
    playChord([523.25, 659.25, 783.99], 'sine', 0.9, 0.35, 0);
    playChord([659.25, 880, 1046.50], 'sine', 1.4, 0.35, 0.11);
  },
  success2: () => {
    playRichTone(523.25, 'triangle', 0.005, 0.08, 0.5, 0.45, 0.25, 0, undefined, undefined, 0);
    playRichTone(659.25, 'triangle', 0.005, 0.08, 0.5, 0.45, 0.25, 0, undefined, undefined, 0.08);
    playRichTone(783.99, 'triangle', 0.005, 0.08, 0.5, 1.2, 0.35, 0, undefined, undefined, 0.16);
  },
  success3: () => playChord([440, 554.37, 659.25, 880], 'triangle', 1.8, 0.3, 0),
  success: () => (sounds as any)[getChoice('sound_leadConverted', 'success1')](),

  // --- INCOME / PAYMENT LOGGED (Crisp metallic cash chime) ---
  income1: () => {
    playRichTone(1500, 'sine', 0.003, 0.08, 0.2, 0.45, 0.28, 0, undefined, undefined, 0);
    playRichTone(2000, 'sine', 0.003, 0.08, 0.2, 0.75, 0.35, 0, undefined, undefined, 0.06);
    playRichTone(2400, 'sine', 0.003, 0.06, 0.1, 0.5, 0.15, 0, undefined, undefined, 0.11);
  },
  income2: () => {
    playRichTone(2000, 'triangle', 0.003, 0.04, 0.1, 0.35, 0.3, 0, 3000, 0.08, 0);
  },
  income3: () => {
    playChord([1200, 1600], 'sine', 0.7, 0.28, 0);
    playChord([1600, 2400], 'sine', 0.9, 0.28, 0.08);
  },
  income: () => (sounds as any)[getChoice('sound_paymentReceived', 'income1')](),

  // --- EXPENSE LOGGED (Satisfying acoustic debit chime) ---
  expense1: () => {
    playRichTone(587.33, 'sine', 0.003, 0.05, 0.3, 0.25, 0.4, 4, undefined, undefined, 0);
    playRichTone(440.00, 'sine', 0.003, 0.06, 0.3, 0.45, 0.4, 4, undefined, undefined, 0.06);
    playRichTone(784.00, 'triangle', 0.002, 0.03, 0.1, 0.08, 0.18, 0, 520, 0.03, 0);
  },
  expense2: () => {
    playRichTone(659.25, 'triangle', 0.003, 0.05, 0.2, 0.3, 0.35, 0, undefined, undefined, 0);
    playRichTone(493.88, 'triangle', 0.003, 0.05, 0.2, 0.35, 0.35, 0, undefined, undefined, 0.07);
  },
  expense3: () => {
    playRichTone(523.25, 'sine', 0.003, 0.04, 0.2, 0.2, 0.35, 0, 392, 0.08, 0);
  },
  expense: () => (sounds as any)[getChoice('sound_expenseLogged', 'expense1')](),

  // --- ITEM DELETED (Crisp tactile pop) ---
  delete1: () => {
    playRichTone(480, 'sine', 0.002, 0.03, 0.1, 0.1, 0.4, 0, 240, 0.04, 0);
  },
  delete2: () => {
    playRichTone(380, 'triangle', 0.002, 0.03, 0.1, 0.1, 0.35, 0, 190, 0.04, 0);
  },
  delete3: () => {
    playRichTone(520, 'sine', 0.002, 0.03, 0.1, 0.08, 0.35, 0, undefined, undefined, 0);
    playRichTone(360, 'sine', 0.002, 0.03, 0.1, 0.12, 0.35, 0, undefined, undefined, 0.03);
  },
  delete: () => (sounds as any)[getChoice('sound_itemDeleted', 'delete1')](),

  // --- EMAIL SENT (Airy swoosh) ---
  mailSend1: () => playRichTone(600, 'sine', 0.01, 0.08, 0.4, 0.5, 0.28, 15, 1200, 0.3, 0),
  mailSend2: () => playRichTone(800, 'triangle', 0.02, 0.08, 0.3, 0.4, 0.2, 0, 400, 0.35, 0),
  mailSend3: () => {
    playRichTone(400, 'sine', 0.01, 0.08, 0.2, 0.45, 0.25, 4, 800, 0.18, 0);
    playRichTone(1000, 'sine', 0.01, 0.08, 0.2, 0.7, 0.2, 4, 2000, 0.25, 0.08);
  },
  mailSend: () => (sounds as any)[getChoice('sound_emailSent', 'mailSend1')](),

  // --- ERROR ALERT (Urgent distinct tone) ---
  error1: () => playRichTone(160, 'sawtooth', 0.003, 0.08, 0.2, 0.35, 0.18, 0, 110, 0.16, 0),
  error2: () => {
    playRichTone(220, 'square', 0.003, 0.06, 0.2, 0.18, 0.14, 0, undefined, undefined, 0);
    playRichTone(220, 'square', 0.003, 0.06, 0.2, 0.32, 0.14, 0, undefined, undefined, 0.1);
  },
  error3: () => playChord([150, 158], 'sawtooth', 0.5, 0.14, 0),
  error: () => (sounds as any)[getChoice('sound_errorAlert', 'error1')](),

  // --- UI TACTILE CLICKS (Instant 2ms latency) ---
  pop: () => playRichTone(620, 'sine', 0.002, 0.025, 0.1, 0.06, 0.16, 0, 900, 0.025, 0),
  click: () => playRichTone(440, 'triangle', 0.002, 0.02, 0.1, 0.04, 0.14, 0, 620, 0.02, 0)
};
