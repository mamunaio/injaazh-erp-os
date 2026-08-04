let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  // If the browser suspended it due to auto-play policies, try to resume
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
    if (sweep) {
      osc.frequency.exponentialRampToValueAtTime(sweep, ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // ignore
  }
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
}

export const sounds = {
  income: () => {
    // "Cha-ching" / Coin sound (bright, high-pitched double beep)
    playTone(1200, 'sine', 0.1, 0.3);
    setTimeout(() => playTone(1600, 'sine', 0.2, 0.4), 100);
  },
  expense: () => {
    // "Deduction" / Thud (low-pitched, quick decay)
    playTone(300, 'triangle', 0.15, 0.4, 150);
  },
  delete: () => {
    // "Trash" / Deep pop
    playTone(200, 'square', 0.1, 0.3, 50);
  },
  mailSend: () => {
    // "Swoosh" / Air (noise burst simulation via high freq sweep)
    playTone(800, 'sine', 0.2, 0.2, 2000);
  },
  edit: () => {
    // Crisp click-pop
    playTone(800, 'sine', 0.05, 0.2, 1200);
  },
  login1: () => {
    // Welcoming boot-up chord (C major 7th approximation)
    playChord([261.63, 329.63, 392.00, 493.88], 'sine', 1.5, 0.2);
  },
  login2: () => {
    // Modern Ascending
    playTone(440, 'sine', 0.1, 0.2);
    setTimeout(() => playTone(554.37, 'sine', 0.1, 0.2), 100);
    setTimeout(() => playTone(659.25, 'sine', 0.3, 0.2), 200);
  },
  login3: () => {
    // Minimal Chime
    playTone(1046.50, 'triangle', 0.4, 0.15);
  },
  login: () => {
    const choice = typeof window !== 'undefined' ? localStorage.getItem('bootSoundChoice') : 'login1';
    if (choice === 'login2') sounds.login2();
    else if (choice === 'login3') sounds.login3();
    else sounds.login1();
  }
};

