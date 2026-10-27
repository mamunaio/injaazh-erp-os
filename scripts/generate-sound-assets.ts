/**
 * Physical Acoustic Sound Generator for Injaazh ERP OS.
 * Synthesizes 100% original, bespoke acoustic UI sound assets using mathematical physical modeling:
 * - Rosewood bar modal resonance (Marimba)
 * - Crystal glass inharmonic modes & mallet transients (Chimes)
 * - Metallic coin inharmonic partials & micro-beating (Payments)
 * - Damped hollow wood cavity thuds (Expenses & Deletes)
 * - Filtered aerodynamic air sweeps (Emails)
 * - Acoustic harmonic chords (System Boot)
 * - Micro-switch tactile impulse modeling (UI Clicks)
 *
 * All generated assets are 100% original, royalty-free, and licensed under CC0 1.0 Universal.
 */

import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function createWavBuffer(samples: Float32Array, sampleRate = SAMPLE_RATE): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // 'data' chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  return buffer;
}

function normalizeAndSoftClip(samples: Float32Array, targetPeak = 0.72): Float32Array {
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  const out = new Float32Array(samples.length);
  if (maxAbs === 0) return out;

  const gain = targetPeak / maxAbs;
  for (let i = 0; i < samples.length; i++) {
    // Soft saturation via tanh curve to prevent any harsh digital clipping
    const v = samples[i] * gain;
    out[i] = Math.tanh(v);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Crystal Glass Chime Synthesizer (Inharmonic Modes + Mallet Strike)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeGlassChime(
  fundamentalFreq: number,
  durationSec: number,
  decayTau: number = 0.28,
  overtoneGain: number = 0.35,
  shimmer: boolean = true
): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  // Inharmonic vibration modes of cylindrical / hemispherical glass:
  // Mode 1: 1.0, Mode 2: 2.32, Mode 3: 4.15, Mode 4: 6.44
  const modes = [
    { ratio: 1.0, gain: 1.0, tau: decayTau },
    { ratio: 2.32, gain: overtoneGain * 0.45, tau: decayTau * 0.45 },
    { ratio: 4.15, gain: overtoneGain * 0.25, tau: decayTau * 0.28 },
    { ratio: 6.44, gain: overtoneGain * 0.12, tau: decayTau * 0.16 },
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Felt mallet impact transient (short impulse over 4ms)
    let strike = 0;
    if (t < 0.008) {
      const strikeEnv = Math.sin((Math.PI * t) / 0.008);
      strike = strikeEnv * ((Math.random() - 0.5) * 0.18 + Math.sin(2 * Math.PI * fundamentalFreq * 3.5 * t) * 0.12);
    }

    let sample = strike;
    for (const mode of modes) {
      const freq = fundamentalFreq * mode.ratio;
      const env = Math.exp(-t / mode.tau);
      // Subtle micro-shimmer frequency modulation
      const mod = shimmer ? Math.sin(2 * Math.PI * 4.2 * t) * 0.0015 : 0;
      sample += Math.sin(2 * Math.PI * freq * (1 + mod) * t) * env * mode.gain;
    }

    out[i] = sample;
  }

  return normalizeAndSoftClip(out, 0.75);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Rosewood Marimba Bar Synthesizer (Acoustic Marimba Tap)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeMarimbaTap(
  fundamentalFreq: number,
  durationSec: number = 0.18,
  decayTau: number = 0.065
): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  // Tuned rosewood bar arch modes: 1.0 (fundamental), 3.98 (octave 2 + third), 9.2 (higher partial)
  const modes = [
    { ratio: 1.0, gain: 1.0, tau: decayTau },
    { ratio: 3.98, gain: 0.22, tau: decayTau * 0.35 },
    { ratio: 9.2, gain: 0.08, tau: decayTau * 0.15 },
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Felt wool mallet impact transient: 3.5ms smooth hump with woody thump
    let strike = 0;
    if (t < 0.012) {
      const strikeEnv = Math.sin((Math.PI * t) / 0.012);
      strike = strikeEnv * (Math.sin(2 * Math.PI * 180 * t) * 0.35 + (Math.random() - 0.5) * 0.15);
    }

    let sample = strike;
    for (const mode of modes) {
      const freq = fundamentalFreq * mode.ratio;
      const env = Math.exp(-t / mode.tau);
      sample += Math.sin(2 * Math.PI * freq * t) * env * mode.gain;
    }

    out[i] = sample;
  }

  return normalizeAndSoftClip(out, 0.72);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Metallic Coin Chime Synthesizer (Refined Metal Resonance)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeCoinChime(
  fundamentalFreq: number,
  durationSec: number = 0.42,
  decayTau: number = 0.16
): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  // Metallic coin modes: inharmonic partials with micro-beating (detuned doublets)
  const partials = [
    { freq: fundamentalFreq, gain: 1.0, tau: decayTau },
    { freq: fundamentalFreq * 1.004, gain: 0.85, tau: decayTau }, // Beating doublet (shimmer)
    { freq: fundamentalFreq * 1.48, gain: 0.40, tau: decayTau * 0.75 },
    { freq: fundamentalFreq * 2.14, gain: 0.25, tau: decayTau * 0.55 },
    { freq: fundamentalFreq * 3.22, gain: 0.15, tau: decayTau * 0.35 },
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Sharp metallic edge contact click (< 2ms)
    let click = 0;
    if (t < 0.003) {
      click = Math.sin((Math.PI * t) / 0.003) * ((Math.random() - 0.5) * 0.45);
    }

    let sample = click;
    for (const p of partials) {
      const env = Math.exp(-t / p.tau);
      sample += Math.sin(2 * Math.PI * p.freq * t) * env * p.gain;
    }

    out[i] = sample;
  }

  return normalizeAndSoftClip(out, 0.70);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Muted Wooden Thud & Cavity Knock Synthesizer (Expenses & Deletes)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeWoodThud(
  startFreq: number,
  endFreq: number,
  durationSec: number = 0.14,
  decayTau: number = 0.045
): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = Math.min(1, t / (durationSec * 0.5));
    // Dynamic downward pitch drop simulating compression of wooden hollow body
    const curFreq = startFreq + (endFreq - startFreq) * Math.pow(progress, 1.8);
    const env = Math.exp(-t / decayTau);

    // Warm body thump transient
    let thump = 0;
    if (t < 0.015) {
      thump = Math.sin((Math.PI * t) / 0.015) * Math.sin(2 * Math.PI * 110 * t) * 0.4;
    }

    const tone = Math.sin(2 * Math.PI * curFreq * t) * env;
    out[i] = tone + thump;
  }

  return normalizeAndSoftClip(out, 0.70);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Filtered Aerodynamic Air Sweep Synthesizer (Email Dispatched)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeAirSweep(
  durationSec: number = 0.32,
  startCutoff: number = 420,
  endCutoff: number = 1350
): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  // Pink noise approximation filtered dynamically
  let b0 = 0, b1 = 0, b2 = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const normT = t / durationSec;

    // Smooth bell-curve envelope for breezy sweep
    const ampEnv = Math.sin(Math.PI * Math.pow(normT, 0.85));

    // Sweep center frequency
    const centerFreq = startCutoff + (endCutoff - startCutoff) * Math.pow(normT, 1.2);

    // White noise source
    const white = Math.random() * 2 - 1;
    // Simple 3-pole pink filter
    b0 = 0.99765 * b0 + white * 0.0990460;
    b1 = 0.96300 * b1 + white * 0.2965164;
    b2 = 0.57000 * b2 + white * 1.0526913;
    const pink = b0 + b1 + b2 + white * 0.1848;

    // Resonant bandpass filter approximation
    const resonance = Math.sin(2 * Math.PI * centerFreq * t);
    const filtered = pink * resonance * 0.6 + pink * 0.4;

    // Layer very soft subtle high harmonic bell chime underneath for executive elegance
    const subtleChime = Math.sin(2 * Math.PI * 1174.66 * t) * Math.exp(-t / 0.18) * 0.12;

    out[i] = (filtered * ampEnv * 0.8) + subtleChime;
  }

  return normalizeAndSoftClip(out, 0.68);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Restrained Dual-Tone Acoustic Warning Synthesizer (Error Alert)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeRestrainedWarning(
  freq1: number,
  freq2: number,
  durationSec: number = 0.32
): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  const tSplit = 0.085; // Time offset between tone 1 and tone 2

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Tone 1: Soft warm felt mallet strike
    let sample1 = 0;
    if (t >= 0) {
      const t1 = t;
      const env1 = Math.exp(-t1 / 0.14);
      sample1 = (Math.sin(2 * Math.PI * freq1 * t1) + Math.sin(2 * Math.PI * freq1 * 2 * t1) * 0.15) * env1;
    }

    // Tone 2: Descending minor tone
    let sample2 = 0;
    if (t >= tSplit) {
      const t2 = t - tSplit;
      const env2 = Math.exp(-t2 / 0.18);
      sample2 = (Math.sin(2 * Math.PI * freq2 * t2) + Math.sin(2 * Math.PI * freq2 * 2 * t2) * 0.12) * env2;
    }

    out[i] = sample1 * 0.5 + sample2 * 0.6;
  }

  return normalizeAndSoftClip(out, 0.70);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Executive Acoustic Swell Synthesizer (System Boot / Login)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeAcousticChord(
  frequencies: number[],
  durationSec: number = 1.1,
  staggerMs: number = 24
): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  frequencies.forEach((freq, idx) => {
    const offsetSec = (idx * staggerMs) / 1000;
    const offsetSamples = Math.floor(offsetSec * SAMPLE_RATE);

    for (let i = offsetSamples; i < totalSamples; i++) {
      const t = (i - offsetSamples) / SAMPLE_RATE;
      // Gentle warm swelling attack (35ms) then long acoustic decay
      const attack = Math.min(1, t / 0.045);
      const decay = Math.exp(-t / 0.45);
      const env = attack * decay;

      // Pure fundamental + warm second harmonic
      const tone = (Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 2 * t) * 0.12) * env;
      out[i] += tone * (1 / Math.sqrt(frequencies.length));
    }
  });

  return normalizeAndSoftClip(out, 0.72);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Micro-Switch Tactile Impulses (UI Click & Dock Pop)
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeTactileClick(durationSec: number = 0.035): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  // Dual micro-contact click modeling a physical mechanical micro-switch (5ms apart)
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Contact 1: Sharp micro-tick at 0ms
    const env1 = Math.exp(-t / 0.0035);
    const tick1 = Math.sin(2 * Math.PI * 620 * t) * env1;

    // Contact 2: Dampened bottom-out click at 5ms
    let tick2 = 0;
    if (t > 0.005) {
      const t2 = t - 0.005;
      const env2 = Math.exp(-t2 / 0.0045);
      tick2 = Math.sin(2 * Math.PI * 440 * t2) * env2 * 0.7;
    }

    out[i] = tick1 + tick2;
  }

  return normalizeAndSoftClip(out, 0.60);
}

function synthesizeDockTick(durationSec: number = 0.025): Float32Array {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t / 0.003);
    out[i] = Math.sin(2 * Math.PI * 780 * t) * env;
  }

  return normalizeAndSoftClip(out, 0.55);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Build Script: Generate all 23 bespoke acoustic UI assets
// ─────────────────────────────────────────────────────────────────────────────
export function generateAllSoundAssets(targetDir: string) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const assets: Record<string, Float32Array> = {
    // 1. Notification (delicate crystal glass dual chime)
    'notification.wav': (() => {
      const totalSamples = Math.floor(SAMPLE_RATE * 0.52);
      const out = new Float32Array(totalSamples);
      const ch1 = synthesizeGlassChime(880.00, 0.52, 0.32, 0.35); // A5
      const ch2 = synthesizeGlassChime(1318.51, 0.44, 0.36, 0.40); // E6
      const offset = Math.floor(0.065 * SAMPLE_RATE);
      for (let i = 0; i < totalSamples; i++) {
        out[i] = ch1[i] * 0.65;
        if (i >= offset && i - offset < ch2.length) {
          out[i] += ch2[i - offset] * 0.75;
        }
      }
      return normalizeAndSoftClip(out, 0.74);
    })(),

    // 2. System Boot / Login (welcoming executive swells)
    'login1.wav': synthesizeAcousticChord([174.61, 261.63, 329.63, 440.00, 523.25], 1.15, 25), // Fmaj9
    'login2.wav': synthesizeAcousticChord([207.65, 261.63, 311.13, 392.00], 1.05, 35),       // Abmaj7
    'login3.wav': synthesizeAcousticChord([293.66, 440.00, 739.99], 0.95, 45),                // D acoustic fifths

    // 3. Edit / Inline Save (tactile marimba & rosewood taps)
    'edit1.wav': (() => {
      // Double tap: A4 (440Hz) -> E5 (659Hz)
      const totalSamples = Math.floor(SAMPLE_RATE * 0.22);
      const out = new Float32Array(totalSamples);
      const tap1 = synthesizeMarimbaTap(440.00, 0.16, 0.055);
      const tap2 = synthesizeMarimbaTap(659.25, 0.16, 0.065);
      const offset = Math.floor(0.045 * SAMPLE_RATE);
      for (let i = 0; i < totalSamples; i++) {
        if (i < tap1.length) out[i] += tap1[i] * 0.7;
        if (i >= offset && i - offset < tap2.length) out[i] += tap2[i - offset] * 0.8;
      }
      return normalizeAndSoftClip(out, 0.72);
    })(),
    'edit2.wav': synthesizeMarimbaTap(523.25, 0.18, 0.065), // Single rosewood C5
    'edit3.wav': (() => {
      // Kalimba duo: G4 -> B4
      const totalSamples = Math.floor(SAMPLE_RATE * 0.20);
      const out = new Float32Array(totalSamples);
      const tap1 = synthesizeMarimbaTap(392.00, 0.15, 0.07);
      const tap2 = synthesizeMarimbaTap(493.88, 0.16, 0.07);
      const offset = Math.floor(0.025 * SAMPLE_RATE);
      for (let i = 0; i < totalSamples; i++) {
        if (i < tap1.length) out[i] += tap1[i] * 0.65;
        if (i >= offset && i - offset < tap2.length) out[i] += tap2[i - offset] * 0.75;
      }
      return normalizeAndSoftClip(out, 0.70);
    })(),

    // 4. Success Confirmation (ascending crystal glass confirmation)
    'success1.wav': (() => {
      // E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz)
      const totalSamples = Math.floor(SAMPLE_RATE * 0.60);
      const out = new Float32Array(totalSamples);
      const n1 = synthesizeGlassChime(659.25, 0.40, 0.22);
      const n2 = synthesizeGlassChime(830.61, 0.45, 0.24);
      const n3 = synthesizeGlassChime(987.77, 0.52, 0.32);
      const off1 = Math.floor(0.055 * SAMPLE_RATE);
      const off2 = Math.floor(0.115 * SAMPLE_RATE);
      for (let i = 0; i < totalSamples; i++) {
        if (i < n1.length) out[i] += n1[i] * 0.55;
        if (i >= off1 && i - off1 < n2.length) out[i] += n2[i - off1] * 0.65;
        if (i >= off2 && i - off2 < n3.length) out[i] += n3[i - off2] * 0.80;
      }
      return normalizeAndSoftClip(out, 0.75);
    })(),
    'success2.wav': (() => {
      // Warm trio: D5 (587Hz) -> F#5 (740Hz) -> A5 (880Hz)
      const totalSamples = Math.floor(SAMPLE_RATE * 0.55);
      const out = new Float32Array(totalSamples);
      const n1 = synthesizeGlassChime(587.33, 0.38, 0.20);
      const n2 = synthesizeGlassChime(739.99, 0.42, 0.22);
      const n3 = synthesizeGlassChime(880.00, 0.48, 0.28);
      const off1 = Math.floor(0.050 * SAMPLE_RATE);
      const off2 = Math.floor(0.100 * SAMPLE_RATE);
      for (let i = 0; i < totalSamples; i++) {
        if (i < n1.length) out[i] += n1[i] * 0.55;
        if (i >= off1 && i - off1 < n2.length) out[i] += n2[i - off1] * 0.65;
        if (i >= off2 && i - off2 < n3.length) out[i] += n3[i - off2] * 0.80;
      }
      return normalizeAndSoftClip(out, 0.74);
    })(),
    'success3.wav': synthesizeAcousticChord([554.37, 830.61, 1108.73], 0.55, 0), // Glass shimmer chord

    // 5. Payment Received / Revenue (refined metallic coin chime)
    'income1.wav': synthesizeCoinChime(1046.50, 0.45, 0.18), // C6 coin ring
    'income2.wav': (() => {
      // Velvet cash: A5 -> E6
      const totalSamples = Math.floor(SAMPLE_RATE * 0.44);
      const out = new Float32Array(totalSamples);
      const c1 = synthesizeCoinChime(880.00, 0.38, 0.14);
      const c2 = synthesizeCoinChime(1318.51, 0.40, 0.18);
      const off = Math.floor(0.040 * SAMPLE_RATE);
      for (let i = 0; i < totalSamples; i++) {
        if (i < c1.length) out[i] += c1[i] * 0.65;
        if (i >= off && i - off < c2.length) out[i] += c2[i - off] * 0.80;
      }
      return normalizeAndSoftClip(out, 0.72);
    })(),
    'income3.wav': synthesizeCoinChime(1174.66, 0.48, 0.20), // Sterling D6

    // 6. Operational Expense (soft wooden debit thud)
    'expense1.wav': synthesizeWoodThud(210.00, 140.00, 0.16, 0.055), // Wooden thud
    'expense2.wav': (() => {
      // Muted double-tap: 230Hz -> 170Hz
      const totalSamples = Math.floor(SAMPLE_RATE * 0.18);
      const out = new Float32Array(totalSamples);
      const t1 = synthesizeWoodThud(230.00, 180.00, 0.10, 0.035);
      const t2 = synthesizeWoodThud(190.00, 140.00, 0.12, 0.045);
      const off = Math.floor(0.035 * SAMPLE_RATE);
      for (let i = 0; i < totalSamples; i++) {
        if (i < t1.length) out[i] += t1[i] * 0.65;
        if (i >= off && i - off < t2.length) out[i] += t2[i - off] * 0.75;
      }
      return normalizeAndSoftClip(out, 0.70);
    })(),
    'expense3.wav': synthesizeWoodThud(196.00, 150.00, 0.18, 0.065), // Resonant cavity knock

    // 7. Delete / Destructive (subtle organic muted pop)
    'delete1.wav': synthesizeWoodThud(320.00, 140.00, 0.09, 0.028),  // Hollow pop
    'delete2.wav': synthesizeWoodThud(270.00, 130.00, 0.085, 0.025), // Damped snap
    'delete3.wav': synthesizeWoodThud(220.00, 150.00, 0.08, 0.022),  // Soft tap

    // 8. Email Sent (filtered air sweep)
    'mailSend1.wav': synthesizeAirSweep(0.32, 420, 1250),
    'mailSend2.wav': synthesizeAirSweep(0.28, 500, 1450),
    'mailSend3.wav': synthesizeAirSweep(0.34, 380, 1100),

    // 9. Error Alert (restrained acoustic dual-tone warning)
    'error1.wav': synthesizeRestrainedWarning(349.23, 293.66, 0.32), // F4 -> D4
    'error2.wav': synthesizeRestrainedWarning(261.63, 261.63, 0.28), // Pulsed notice
    'error3.wav': synthesizeAcousticChord([293.66, 349.23], 0.30, 0), // Warm minor dyad

    // 10. UI Clicks (tactile feedback)
    'click.wav': synthesizeTactileClick(0.035),
    'pop.wav': synthesizeDockTick(0.025)
  };

  const results: { file: string; bytes: number; durationMs: number }[] = [];

  for (const [filename, samples] of Object.entries(assets)) {
    const buffer = createWavBuffer(samples);
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, buffer);
    results.push({
      file: filename,
      bytes: buffer.length,
      durationMs: Math.round((samples.length / SAMPLE_RATE) * 1000)
    });
  }

  return results;
}

if (require.main === module) {
  const targetDir = path.resolve(__dirname, '../public/sounds');
  console.log(`Generating acoustic assets into: ${targetDir}`);
  const created = generateAllSoundAssets(targetDir);
  console.log(`Generated ${created.length} sound assets successfully:`);
  let totalBytes = 0;
  created.forEach(c => {
    totalBytes += c.bytes;
    console.log(`  - ${c.file} (${c.durationMs}ms, ${(c.bytes / 1024).toFixed(1)} KB)`);
  });
  console.log(`Total footprint: ${(totalBytes / 1024).toFixed(1)} KB`);
}
