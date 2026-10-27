# Injaazh ERP OS — Sound Asset Manifest & Licensing Specification

All audio assets in this directory (`public/sounds/`) are 100% original, bespoke acoustic UI sound samples synthesized specifically for the Injaazh ERP OS application via mathematical physical-acoustic modeling (modal vibration equations, inharmonic partial synthesis, contact-impulse modeling, and exponential decay damping).

## Licensing & Attribution

- **License:** [Creative Commons Zero (CC0 1.0 Universal) — Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/)
- **Author / Provenance:** Injaazh ERP OS Project / Bespoke Physical Acoustic Synthesis Pipeline (`scripts/generate-sound-assets.ts`).
- **Commercial Use:** Unconditionally permitted for commercial, private, and enterprise deployment. No royalties, permissions, or restrictive commercial licensing agreements apply.
- **Third-Party Proprietary Notice:** Zero audio files were sourced or copied from commercial operating systems (Apple macOS/iOS, Microsoft Windows, Google Android, or Slack).

## Audio Specification Standards

- **Container & Encoding:** Standard RIFF WAVE (`audio/wav`), Linear PCM 16-bit.
- **Sample Rate:** 44,100 Hz (44.1 kHz).
- **Channels:** Single Channel (Mono) for ultra-compact storage, zero phase-cancellation, and direct routing into Web Audio API `AudioContext` graphs.
- **Normalization:** Peak normalized to -3 dBFS with soft tanh saturation to guarantee 0.0 dB clipping margin.
- **Latency Target:** Sub-5ms playback initiation via pre-cached Web Audio `AudioBuffer` objects.

---

## Complete Sound Asset Catalog

| Filename | Duration | Size | Target Category | Acoustic Model & Description |
| :--- | :--- | :--- | :--- | :--- |
| `notification.wav` | 520ms | 44.8 KB | `notification` | Warm delicate crystal glass dual chime (A5 880Hz + E6 1318Hz) with inharmonic glass modes [1.0, 2.32, 4.15] and soft felt mallet strike. |
| `login1.wav` | 1150ms | 99.1 KB | `systemBoot` | Welcoming executive Fmaj9 acoustic chord swell (F3, C4, E4, A4, C5) with warm 45ms attack and resonant decay. |
| `login2.wav` | 1050ms | 90.5 KB | `systemBoot` | Ascending Abmaj7 acoustic glow chord (Ab3, C4, Eb4, G4) with 35ms voice stagger. |
| `login3.wav` | 950ms | 81.9 KB | `systemBoot` | Minimal acoustic fifth chime (D3, A3, F#4) with shimmering open acoustic bell resonance. |
| `edit1.wav` | 220ms | 19.0 KB | `notification` (`edit`) | Tactile rosewood marimba double-tap (A4 440Hz -> E5 659Hz) with modal arch overtones [1.0, 3.98, 9.2]. |
| `edit2.wav` | 180ms | 15.5 KB | `notification` (`edit`) | Single resonant rosewood bar strike (C5 523Hz) with rounded felt mallet attack. |
| `edit3.wav` | 200ms | 17.3 KB | `notification` (`edit`) | Warm acoustic kalimba duo tap (G4 392Hz -> B4 494Hz) with 25ms offset. |
| `success1.wav` | 600ms | 51.7 KB | `notification` (`success`) | Ascending crystal glass champagne shimmer arpeggio (E5 659Hz -> G#5 831Hz -> B5 988Hz). |
| `success2.wav` | 550ms | 47.4 KB | `notification` (`success`) | Warm ascending acoustic trio (D5 587Hz -> F#5 740Hz -> A5 880Hz). |
| `success3.wav` | 550ms | 47.4 KB | `notification` (`success`) | Simultaneous harmonic glass shimmer chord (C#5, G#5, C#6). |
| `income1.wav` | 450ms | 38.8 KB | `paymentReceived` | Refined metallic coin ring (C6 1046Hz) with inharmonic beating doublet and edge contact transient. |
| `income2.wav` | 440ms | 37.9 KB | `paymentReceived` | Velvet cash metallic chime (A5 880Hz -> E6 1318Hz) with warm acoustic ring. |
| `income3.wav` | 480ms | 41.4 KB | `paymentReceived` | Sterling metallic chime (D6 1175Hz) with shimmering sustain tail. |
| `expense1.wav` | 160ms | 13.8 KB | `expenseLogged` | Soft low-frequency wooden debit thud (210Hz swept to 140Hz) with damped acoustic cavity thump. |
| `expense2.wav` | 180ms | 15.5 KB | `expenseLogged` | Muted woody double-tap (230Hz -> 170Hz) with hollow woodblock resonance. |
| `expense3.wav` | 180ms | 15.5 KB | `expenseLogged` | Resonant hollow wooden cavity knock (196Hz G3). |
| `delete1.wav` | 90ms | 7.8 KB | `itemDeleted` | Subtle, organic damped wooden pop (320Hz swept to 140Hz in 28ms) with high damping. |
| `delete2.wav` | 85ms | 7.4 KB | `itemDeleted` | Acoustic damped wood snap (270Hz -> 130Hz). |
| `delete3.wav` | 80ms | 6.9 KB | `itemDeleted` | Micro wooden tactile drop (220Hz -> 150Hz). |
| `mailSend1.wav` | 320ms | 27.6 KB | `emailSent` | Gentle aerodynamic air sweep (filtered pink noise 420Hz -> 1250Hz) with delicate high bell undertone. |
| `mailSend2.wav` | 280ms | 24.2 KB | `emailSent` | Crisp digital breeze aero curve (500Hz -> 1450Hz). |
| `mailSend3.wav` | 340ms | 29.3 KB | `emailSent` | Shimmer air sweep (380Hz -> 1100Hz) with layered acoustic breath. |
| `error1.wav` | 320ms | 27.6 KB | `errorAlert` | Restrained acoustic dual-tone warning (F4 349Hz -> D4 294Hz descending minor third) with soft felt attack. |
| `error2.wav` | 280ms | 24.2 KB | `errorAlert` | Pulsed warm acoustic notice (dual C4 262Hz sine pulses). |
| `error3.wav` | 300ms | 25.9 KB | `errorAlert` | Warm minor dyad chord (D4 294Hz + F4 349Hz) with soft acoustic decay. |
| `click.wav` | 35ms | 3.1 KB | `uiClicks` | Ultra-subtle tactile mechanical switch tap (dual contact transient 5ms apart, critically damped). |
| `pop.wav` | 25ms | 2.2 KB | `uiClicks` | Soft tactile dock hover tick (crisp micro-pulse at 780Hz). |

**Total Repository Footprint:** 863.8 KB across 27 audio files.
