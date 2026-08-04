let sharedAudioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
      
      // Master Gain for smooth limiting
      masterGainNode = sharedAudioCtx.createGain();
      masterGainNode.gain.value = 0.8;
      
      // Add a lush delay/reverb effect for premium feel
      const delay = sharedAudioCtx.createDelay();
      delay.delayTime.value = 0.15; // 150ms delay
      const feedback = sharedAudioCtx.createGain();
      feedback.gain.value = 0.25; // low feedback
      const filter = sharedAudioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000; // roll off high frequencies in echo

      delay.connect(feedback);
      feedback.connect(filter);
      filter.connect(delay);
      
      delay.connect(masterGainNode);
      masterGainNode.connect(sharedAudioCtx.destination);
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return { ctx: sharedAudioCtx, dest: masterGainNode || sharedAudioCtx?.destination };
};

// Advanced tone generator with ADSR and Detune (Chorus effect)
const playRichTone = (
  freq: number, 
  type: OscillatorType, 
  attack: number = 0.05,
  decay: number = 0.1,
  sustain: number = 0.5,
  release: number = 1.0,
  vol: number = 0.5, 
  detuneSpread: number = 8,
  sweepFreq?: number,
  sweepTime?: number
) => {
  try {
    const audio = getAudioContext();
    if (!audio || !audio.ctx || !audio.dest) return;
    const { ctx, dest } = audio;

    const gain = ctx.createGain();
    gain.connect(dest);
    
    // ADSR Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack); // Attack
    gain.gain.exponentialRampToValueAtTime(vol * sustain, ctx.currentTime + attack + decay); // Decay
    gain.gain.setValueAtTime(vol * sustain, ctx.currentTime + attack + decay); // Sustain
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + attack + decay + release); // Release

    const duration = attack + decay + release;

    // Create 3 oscillators for a thick, premium sound (Unison)
    const createOsc = (detune: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.value = detune;
      
      if (sweepFreq && sweepTime) {
        osc.frequency.exponentialRampToValueAtTime(sweepFreq, ctx.currentTime + sweepTime);
      }
      
      osc.connect(gain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    };

    createOsc(0);           // Center
    createOsc(detuneSpread); // Right-ish detune
    createOsc(-detuneSpread);// Left-ish detune

  } catch (e) {}
};

const playChord = (frequencies: number[], type: OscillatorType, release: number = 1.5, vol: number = 0.2) => {
  frequencies.forEach(freq => {
    playRichTone(freq, type, 0.05, 0.2, 0.6, release, vol / frequencies.length, 5);
  });
};

const getChoice = (key: string, defaultChoice: string) => {
  if (typeof window === 'undefined') return defaultChoice;
  return localStorage.getItem(key) || defaultChoice;
};

export const sounds = {
  // --- SYSTEM BOOT (Lush, expansive chords) ---
  login1: () => {
    playChord([261.63, 329.63, 392.00, 523.25], 'sine', 2.0, 0.4); // Cmaj9
    setTimeout(() => playChord([349.23, 440, 523.25, 698.46], 'sine', 2.5, 0.3), 150); // Fmaj9
  },
  login2: () => {
    playRichTone(440, 'sine', 0.1, 0.1, 0.5, 1.0, 0.2, 10);
    setTimeout(() => playRichTone(554.37, 'sine', 0.1, 0.1, 0.5, 1.0, 0.2, 10), 150);
    setTimeout(() => playRichTone(659.25, 'triangle', 0.1, 0.1, 0.5, 2.5, 0.3, 10), 300);
  },
  login3: () => {
    playRichTone(1046.50, 'triangle', 0.2, 0.2, 0.4, 3.0, 0.2, 5);
    setTimeout(() => playRichTone(1318.51, 'triangle', 0.2, 0.2, 0.4, 2.8, 0.15, 5), 200);
  },
  login: () => (sounds as any)[getChoice('sound_systemBoot', 'login1')](),

  // --- NEW LEAD ADDED (Sparkling chimes) ---
  edit1: () => {
    playRichTone(1046.50, 'sine', 0.02, 0.1, 0.2, 1.0, 0.3);
    setTimeout(() => playRichTone(1567.98, 'sine', 0.02, 0.1, 0.2, 1.5, 0.2), 100);
  },
  edit2: () => {
    playRichTone(880, 'triangle', 0.05, 0.1, 0.2, 0.5, 0.3, 0, 1760, 0.2); // Glide up
  },
  edit3: () => playChord([1046.50, 1318.51], 'sine', 1.0, 0.3),
  edit: () => (sounds as any)[getChoice('sound_newLead', 'edit1')](),

  // --- LEAD CONVERTED (Triumphant) ---
  success1: () => {
    playChord([523.25, 659.25, 783.99], 'sine', 1.0, 0.4);
    setTimeout(() => playChord([659.25, 880, 1046.50], 'sine', 1.5, 0.4), 150);
  },
  success2: () => {
    playRichTone(523.25, 'triangle', 0.05, 0.1, 0.5, 0.5, 0.3);
    setTimeout(() => playRichTone(659.25, 'triangle', 0.05, 0.1, 0.5, 0.5, 0.3), 100);
    setTimeout(() => playRichTone(783.99, 'triangle', 0.05, 0.1, 0.5, 1.5, 0.4), 200);
  },
  success3: () => playChord([440, 554.37, 659.25, 880], 'triangle', 2.0, 0.3),
  success: () => (sounds as any)[getChoice('sound_leadConverted', 'success1')](),

  // --- INCOME LOGGED (Crisp, metallic cash) ---
  income1: () => {
    playRichTone(1500, 'sine', 0.01, 0.1, 0.2, 0.5, 0.3);
    setTimeout(() => playRichTone(2000, 'sine', 0.01, 0.1, 0.2, 0.8, 0.4), 80);
  },
  income2: () => {
    playRichTone(2000, 'triangle', 0.02, 0.05, 0.1, 0.4, 0.3, 0, 3000, 0.1);
  },
  income3: () => {
    playChord([1200, 1600], 'sine', 0.8, 0.3);
    setTimeout(() => playChord([1600, 2400], 'sine', 1.0, 0.3), 100);
  },
  income: () => (sounds as any)[getChoice('sound_paymentReceived', 'income1')](),

  // --- EXPENSE LOGGED (Deep, soft thud) ---
  expense1: () => playRichTone(200, 'sine', 0.05, 0.1, 0.2, 0.4, 0.5, 0, 100, 0.2),
  expense2: () => {
    playRichTone(300, 'triangle', 0.02, 0.1, 0.1, 0.3, 0.4);
    setTimeout(() => playRichTone(250, 'triangle', 0.02, 0.1, 0.1, 0.3, 0.4), 100);
  },
  expense3: () => playRichTone(150, 'square', 0.1, 0.2, 0.1, 0.3, 0.2, 0, 80, 0.3),
  expense: () => (sounds as any)[getChoice('sound_expenseLogged', 'expense1')](),

  // --- ITEM DELETED (Hollow pop) ---
  delete1: () => playRichTone(300, 'triangle', 0.02, 0.1, 0.1, 0.3, 0.4, 0, 150, 0.1),
  delete2: () => playRichTone(150, 'square', 0.01, 0.1, 0.1, 0.2, 0.2),
  delete3: () => {
    playRichTone(250, 'sine', 0.02, 0.05, 0.1, 0.2, 0.4);
    setTimeout(() => playRichTone(200, 'sine', 0.02, 0.05, 0.1, 0.2, 0.4), 50);
  },
  delete: () => (sounds as any)[getChoice('sound_itemDeleted', 'delete1')](),

  // --- EMAIL SENT (Airy swoosh) ---
  mailSend1: () => playRichTone(600, 'sine', 0.1, 0.1, 0.5, 0.6, 0.3, 20, 1200, 0.4),
  mailSend2: () => playRichTone(800, 'triangle', 0.2, 0.1, 0.4, 0.5, 0.2, 0, 400, 0.5),
  mailSend3: () => {
    playRichTone(400, 'sine', 0.05, 0.1, 0.2, 0.5, 0.3, 5, 800, 0.2);
    setTimeout(() => playRichTone(1000, 'sine', 0.1, 0.1, 0.2, 0.8, 0.2, 5, 2000, 0.3), 100);
  },
  mailSend: () => (sounds as any)[getChoice('sound_emailSent', 'mailSend1')](),

  // --- ERROR ALERT (Soft but urgent buzz) ---
  error1: () => playRichTone(150, 'sawtooth', 0.05, 0.1, 0.2, 0.4, 0.2, 0, 120, 0.2),
  error2: () => {
    playRichTone(200, 'square', 0.02, 0.1, 0.2, 0.2, 0.15);
    setTimeout(() => playRichTone(200, 'square', 0.02, 0.1, 0.2, 0.4, 0.15), 150);
  },
  error3: () => playChord([150, 158], 'sawtooth', 0.6, 0.15), // Dissonant minor second
  error: () => (sounds as any)[getChoice('sound_errorAlert', 'error1')]()
};
