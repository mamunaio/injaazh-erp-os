let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number, sweep?: number) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(sweep, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

const playChord = (frequencies: number[], type: OscillatorType, duration: number, vol: number) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1);
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    frequencies.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    });
  } catch(e) {}
};

const getChoice = (key: string, defaultChoice: string) => {
  if (typeof window === 'undefined') return defaultChoice;
  return localStorage.getItem(key) || defaultChoice;
};

export const sounds = {
  // --- SYSTEM BOOT ---
  login1: () => playChord([261.63, 329.63, 392.00, 493.88], 'sine', 1.5, 0.2),
  login2: () => {
    playTone(440, 'sine', 0.6, 0.2);
    setTimeout(() => playTone(554.37, 'sine', 0.8, 0.2), 300);
    setTimeout(() => playTone(659.25, 'sine', 1.5, 0.2), 600);
  },
  login3: () => {
    playTone(1046.50, 'triangle', 2.0, 0.15);
    setTimeout(() => playTone(1318.51, 'triangle', 1.8, 0.1), 200);
  },
  login: () => (sounds as any)[getChoice('bootSoundChoice', 'login1')](),

  // --- NEW LEAD ADDED ---
  edit1: () => {
    playTone(900, 'sine', 1.0, 0.2);
    setTimeout(() => playTone(1200, 'sine', 0.8, 0.1), 150);
  },
  edit2: () => playTone(1200, 'sine', 0.4, 0.2, 1800),
  edit3: () => playTone(1500, 'square', 0.3, 0.1),
  edit: () => (sounds as any)[getChoice('newLeadSoundChoice', 'edit1')](),

  // --- LEAD CONVERTED ---
  success1: () => playChord([523.25, 659.25, 783.99], 'sine', 1.0, 0.2),
  success2: () => {
    playTone(600, 'sine', 0.2, 0.2);
    setTimeout(() => playTone(800, 'sine', 0.4, 0.2), 150);
    setTimeout(() => playTone(1000, 'sine', 0.6, 0.2), 300);
  },
  success3: () => playChord([440, 554.37, 659.25, 880], 'triangle', 1.5, 0.15),
  success: () => (sounds as any)[getChoice('leadConvertedSoundChoice', 'success1')](),

  // --- INCOME LOGGED ---
  income1: () => {
    playTone(1200, 'sine', 0.1, 0.3);
    setTimeout(() => playTone(1600, 'sine', 0.2, 0.4), 100);
  },
  income2: () => {
    playTone(1500, 'triangle', 0.2, 0.3);
    setTimeout(() => playTone(2000, 'triangle', 0.4, 0.3), 80);
  },
  income3: () => {
    playChord([1200, 1500], 'sine', 0.5, 0.2);
    setTimeout(() => playChord([1600, 2000], 'sine', 0.6, 0.2), 150);
  },
  income: () => (sounds as any)[getChoice('paymentReceivedSoundChoice', 'income1')](),

  // --- EXPENSE LOGGED ---
  expense1: () => playTone(300, 'triangle', 0.15, 0.4, 150),
  expense2: () => {
    playTone(400, 'square', 0.1, 0.3, 200);
    setTimeout(() => playTone(300, 'square', 0.2, 0.3, 100), 100);
  },
  expense3: () => playTone(200, 'sawtooth', 0.4, 0.2, 50),
  expense: () => (sounds as any)[getChoice('expenseLoggedSoundChoice', 'expense1')](),

  // --- ITEM DELETED ---
  delete1: () => playTone(200, 'square', 0.1, 0.3, 50),
  delete2: () => playTone(150, 'sawtooth', 0.2, 0.3, 20),
  delete3: () => {
    playTone(300, 'square', 0.1, 0.2, 100);
    setTimeout(() => playTone(100, 'square', 0.3, 0.2, 50), 100);
  },
  delete: () => (sounds as any)[getChoice('itemDeletedSoundChoice', 'delete1')](),

  // --- EMAIL SENT ---
  mailSend1: () => playTone(800, 'sine', 0.2, 0.2, 2000),
  mailSend2: () => playTone(600, 'triangle', 0.3, 0.15, 1800),
  mailSend3: () => {
    playTone(400, 'sine', 0.1, 0.2, 1000);
    setTimeout(() => playTone(1000, 'sine', 0.4, 0.2, 2500), 50);
  },
  mailSend: () => (sounds as any)[getChoice('emailSentSoundChoice', 'mailSend1')](),

  // --- ERROR ALERT ---
  error1: () => playTone(150, 'sawtooth', 0.4, 0.2, 100),
  error2: () => {
    playTone(200, 'square', 0.1, 0.2);
    setTimeout(() => playTone(200, 'square', 0.3, 0.2), 150);
  },
  error3: () => playChord([150, 160], 'sawtooth', 0.6, 0.3),
  error: () => (sounds as any)[getChoice('errorAlertSoundChoice', 'error1')]()
};
