/**
 * Phase 01E: Central Sound Service & Persistent Settings Test Suite
 *
 * Verifies:
 * 1. Default sound settings (master mute OFF, volume 50%, all categories enabled).
 * 2. Persistence and resilience against invalid / corrupted stored settings.
 * 3. Master mute blocks every public sound method from scheduling oscillators.
 * 4. Master volume dynamically scales master gain node without recreating AudioContext.
 * 5. Independent category mute behavior and isolation.
 * 6. Settings updates propagate immediately without page reload via reactive subscribers.
 * 7. Cross-tab synchronization via storage events.
 * 8. Centralized rate limiting throttles rapid direct and notification sound calls.
 * 9. Suspended AudioContext and browser autoplay policies are handled gracefully.
 * 10. Web Audio oscillator and gain nodes are disconnected and cleaned up after playback.
 * 11. notify.success semantic mapping plays sounds.success instead of sounds.edit.
 * 12. Preview behavior strictly respects master mute and category mute settings.
 *
 * Run via: npx tsx tests/security/phase01e-sound-system.test.ts
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// 1. Mock Browser Environment for Web Audio API & Storage
// ---------------------------------------------------------------------------
let createdOscillators: MockOscillatorNode[] = [];
let createdGainNodes: MockGainNode[] = [];
let createdFilterNodes: MockBiquadFilterNode[] = [];
let createdBufferSources: MockAudioBufferSourceNode[] = [];

class MockAudioBufferSourceNode {
  buffer: any = null;
  connectedTo: any = null;
  isStarted = false;
  isDisconnected = false;
  onended: (() => void) | null = null;

  constructor() {
    createdBufferSources.push(this);
  }

  connect(dest: any) {
    this.connectedTo = dest;
  }

  start(_when = 0) {
    this.isStarted = true;
  }

  disconnect() {
    this.isDisconnected = true;
  }
}

class MockBiquadFilterNode {
  type: BiquadFilterType = 'lowpass';
  frequency = {
    value: 3200,
    setValueAtTime: (val: number) => { this.frequency.value = val; }
  };
  Q = {
    value: 1,
    setValueAtTime: (val: number) => { this.Q.value = val; }
  };
  connectedTo: any = null;
  isDisconnected = false;

  constructor() {
    createdFilterNodes.push(this);
  }

  connect(dest: any) { this.connectedTo = dest; }
  disconnect() { this.isDisconnected = true; }
}

class MockGainNode {
  gain: {
    value: number;
    setValueAtTime: (val: number, _time?: number) => void;
    linearRampToValueAtTime: (_val: number, _time: number) => void;
    exponentialRampToValueAtTime: (_val: number, _time: number) => void;
  };
  connectedTo: any = null;
  isDisconnected = false;

  constructor() {
    const gainObj = {
      value: 1,
      setValueAtTime: (val: number) => { gainObj.value = val; },
      linearRampToValueAtTime: (_val: number, _time: number) => {},
      exponentialRampToValueAtTime: (_val: number, _time: number) => {}
    };
    this.gain = gainObj;
    createdGainNodes.push(this);
  }

  connect(dest: any) {
    this.connectedTo = dest;
  }

  disconnect() {
    this.isDisconnected = true;
  }
}

class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = {
    setValueAtTime: (_v: number, _t: number) => {},
    exponentialRampToValueAtTime: (_v: number, _t: number) => {}
  };
  detune = {
    setValueAtTime: (_v: number, _t: number) => {}
  };
  isStarted = false;
  isStopped = false;
  isDisconnected = false;
  onended: (() => void) | null = null;
  connectedTo: any = null;

  constructor() {
    createdOscillators.push(this);
  }

  connect(dest: any) {
    this.connectedTo = dest;
  }

  start(_t?: number) {
    this.isStarted = true;
  }

  stop(_t?: number) {
    this.isStopped = true;
    setTimeout(() => {
      if (this.onended) {
        this.onended();
      }
    }, 5);
  }

  disconnect() {
    this.isDisconnected = true;
  }
}

class MockAudioContext {
  currentTime = 0.05;
  state: AudioContextState = 'running';
  destination = { id: 'speakers' };
  resumed = false;

  createGain() {
    return new MockGainNode();
  }

  createOscillator() {
    return new MockOscillatorNode();
  }

  createBiquadFilter() {
    return new MockBiquadFilterNode();
  }

  createBuffer(_channels: number, _length: number, _sampleRate: number) {
    return {};
  }

  createBufferSource() {
    return new MockAudioBufferSourceNode();
  }

  async resume() {
    this.state = 'running';
    this.resumed = true;
  }
}

// In-memory mock localStorage
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

// Setup mock window & globals before loading sound module
const listenersMap: Record<string, Set<Function>> = {};

if (typeof (global as any).window === 'undefined') {
  (global as any).window = {
    AudioContext: MockAudioContext,
    localStorage: mockLocalStorage,
    addEventListener: (type: string, fn: Function) => {
      if (!listenersMap[type]) listenersMap[type] = new Set();
      listenersMap[type].add(fn);
    },
    removeEventListener: (type: string, fn: Function) => {
      if (listenersMap[type]) listenersMap[type].delete(fn);
    },
    dispatchEvent: (event: any) => {
      const set = listenersMap[event.type];
      if (set) {
        set.forEach(fn => fn(event));
      }
      return true;
    }
  };
  (global as any).localStorage = mockLocalStorage;
}

// Import sound module after window mock is established
import { sounds, soundSettings, SOUND_STORAGE_KEYS, _testing } from '../../lib/sound';
import { notify } from '../../lib/notify';

class TestRunner {
  passed = 0;
  failed = 0;

  async test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      this.passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      this.failed++;
    }
  }
}

async function runTests() {
  const runner = new TestRunner();
  console.log('\n========================================================================');
  console.log('🔊 Phase 01E: Central Sound Service & Persistent Settings Test Suite');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: Default Settings
  // -------------------------------------------------------------------------
  await runner.test('1.1: Default sound settings are unmuted, 50% volume, and all categories enabled', () => {
    storageMap.clear();
    soundSettings.resetToDefaults();

    const current = soundSettings.getSoundSettings();
    if (current.masterMute !== false) {
      throw new Error(`Expected default masterMute to be false, got: ${current.masterMute}`);
    }
    if (current.masterVolume !== 50) {
      throw new Error(`Expected default masterVolume to be 50, got: ${current.masterVolume}`);
    }
    if (!current.events.systemBoot || !current.events.paymentReceived || !current.events.itemDeleted) {
      throw new Error(`Expected all categories to be enabled by default`);
    }
    if (!soundSettings.isSoundAllowed('systemBoot')) {
      throw new Error(`isSoundAllowed should return true for default systemBoot`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 2: Persistence & Corrupted Storage Resilience
  // -------------------------------------------------------------------------
  await runner.test('2.1: Settings persist to localStorage with robust fallback on corrupted or invalid data', () => {
    soundSettings.resetToDefaults();

    // Set valid mute and volume
    soundSettings.setMasterMute(true);
    soundSettings.setMasterVolume(75);
    soundSettings.setCategoryEnabled('expenseLogged', false);

    if (storageMap.get(SOUND_STORAGE_KEYS.MASTER_MUTE) !== 'true') {
      throw new Error('Master mute was not persisted to localStorage');
    }
    if (storageMap.get(SOUND_STORAGE_KEYS.MASTER_VOLUME) !== '75') {
      throw new Error('Master volume 75 was not persisted to localStorage');
    }

    const eventsJson = JSON.parse(storageMap.get(SOUND_STORAGE_KEYS.EVENTS) || '{}');
    if (eventsJson.expenseLogged !== false) {
      throw new Error('Category toggle expenseLogged: false was not persisted to localStorage');
    }

    // Now corrupt localStorage
    storageMap.set(SOUND_STORAGE_KEYS.MASTER_VOLUME, 'not-a-number');
    storageMap.set(SOUND_STORAGE_KEYS.EVENTS, '{invalid json');

    // Refresh from storage: must not crash and must preserve valid states
    soundSettings.refreshFromStorage();
    const refreshed = soundSettings.getSoundSettings();
    if (isNaN(refreshed.masterVolume)) {
      throw new Error('Master volume became NaN on invalid storage data');
    }
    if (typeof refreshed.events !== 'object' || refreshed.events === null) {
      throw new Error('Events dictionary corrupted on invalid JSON');
    }
  });

  // -------------------------------------------------------------------------
  // Test 3: Master Mute Blocks Every Public Sound Method
  // -------------------------------------------------------------------------
  await runner.test('3.1: Master mute blocks every sound method from scheduling AudioContext nodes', () => {
    soundSettings.setMasterMute(true);
    _testing.resetRateLimiter();
    createdOscillators = [];
    createdGainNodes = [];
    createdBufferSources = [];

    // Attempt to invoke every public sound method
    sounds.notification();
    sounds.login();
    sounds.login1();
    sounds.edit();
    sounds.edit1();
    sounds.success();
    sounds.success1();
    sounds.income();
    sounds.income1();
    sounds.expense();
    sounds.delete();
    sounds.mailSend();
    sounds.error();
    sounds.pop();
    sounds.click();

    // Verify ZERO oscillator or buffer source nodes were scheduled
    if (createdOscillators.length > 0) {
      throw new Error(`Master mute failed to silence playback: ${createdOscillators.length} oscillators were scheduled`);
    }
    if (createdBufferSources.length > 0) {
      throw new Error(`Master mute failed to silence playback: ${createdBufferSources.length} buffer sources were scheduled`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 4: Master Volume Dynamic Scaling
  // -------------------------------------------------------------------------
  await runner.test('4.1: Volume changes immediately scale master gain node without recreating AudioContext', () => {
    soundSettings.setMasterMute(false);
    soundSettings.setMasterVolume(80);
    _testing.resetRateLimiter();
    createdOscillators = [];
    createdGainNodes = [];

    // Trigger sound to initialize shared audio graph
    sounds.pop();

    const masterGain = _testing.getMasterGainNode();
    if (!masterGain) {
      throw new Error('Master gain node was not created on playback');
    }
    if (Math.abs(masterGain.gain.value - 0.8) > 0.001) {
      throw new Error(`Expected masterGain to be 0.8 at 80% volume, got: ${masterGain.gain.value}`);
    }

    // Dynamically change volume to 35%
    soundSettings.setMasterVolume(35);
    if (Math.abs(masterGain.gain.value - 0.35) > 0.001) {
      throw new Error(`Master gain did not reactively update to 0.35, got: ${masterGain.gain.value}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 5: Category Mute Isolation
  // -------------------------------------------------------------------------
  await runner.test('5.1: Muting one category silences only that category and leaves unrelated categories active', () => {
    soundSettings.resetToDefaults();
    soundSettings.setMasterMute(false);
    _testing.resetRateLimiter();

    // Mute only itemDeleted
    soundSettings.setCategoryEnabled('itemDeleted', false);

    if (soundSettings.isCategoryEnabled('itemDeleted') !== false) {
      throw new Error('itemDeleted was not disabled');
    }
    if (soundSettings.isCategoryEnabled('paymentReceived') !== true) {
      throw new Error('paymentReceived was unexpectedly altered when muting itemDeleted');
    }

    // Calling delete should produce 0 oscillators
    createdOscillators = [];
    sounds.delete();
    if (createdOscillators.length > 0) {
      throw new Error(`delete sound played while itemDeleted category was muted`);
    }

    // Calling income should produce oscillators
    _testing.resetRateLimiter();
    sounds.income();
    if (createdOscillators.length === 0) {
      throw new Error(`income sound was blocked when itemDeleted was muted`);
    }

    // Re-enable itemDeleted and verify delete now works
    soundSettings.setCategoryEnabled('itemDeleted', true);
    _testing.resetRateLimiter();
    createdOscillators = [];
    sounds.delete();
    if (createdOscillators.length === 0) {
      throw new Error(`delete sound remained muted after category was re-enabled`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 6: In-Memory Subscription & Zero-Reload Reactivity
  // -------------------------------------------------------------------------
  await runner.test('6.1: Subscriptions receive instant notifications when volume or mute updates occur', () => {
    let capturedMute: boolean | null = null;
    let capturedVolume: number | null = null;

    const unsubscribe = soundSettings.subscribeSoundSettings((settings) => {
      capturedMute = settings.masterMute;
      capturedVolume = settings.masterVolume;
    });

    soundSettings.setMasterMute(true);
    if (capturedMute !== true) {
      throw new Error('Subscriber did not receive masterMute update');
    }

    soundSettings.setMasterVolume(65);
    if (capturedVolume !== 65) {
      throw new Error('Subscriber did not receive masterVolume update');
    }

    unsubscribe();
    soundSettings.setMasterVolume(20);
    if (capturedVolume === 20) {
      throw new Error('Unsubscribed listener was still invoked');
    }
  });

  // -------------------------------------------------------------------------
  // Test 7: Multi-Tab Synchronization via Storage Event
  // -------------------------------------------------------------------------
  await runner.test('7.1: Multi-tab storage event updates settings and dispatches internal event', () => {
    soundSettings.resetToDefaults();

    // Simulate storage event from Tab B
    storageMap.set(SOUND_STORAGE_KEYS.MASTER_MUTE, 'true');
    (global as any).window.dispatchEvent({
      type: 'storage',
      key: SOUND_STORAGE_KEYS.MASTER_MUTE,
      newValue: 'true'
    });

    if (soundSettings.isMasterMuted() !== true) {
      throw new Error('Multi-tab storage event failed to synchronize masterMute');
    }
  });

  // -------------------------------------------------------------------------
  // Test 8: Centralized Rate Limiting / Cooldown
  // -------------------------------------------------------------------------
  await runner.test('8.1: Rate limiter throttles rapid burst calls to prevent acoustic pileup', () => {
    soundSettings.resetToDefaults();
    _testing.resetRateLimiter();
    createdOscillators = [];

    // Rapid burst of 5 clicks in synchronous execution
    for (let i = 0; i < 5; i++) {
      sounds.pop();
    }

    // Pop produces 1 oscillator per strike; burst of 5 within 0ms should throttle to 1
    if (createdOscillators.length !== 1) {
      throw new Error(`Expected 1 oscillator from burst of 5 pops, got: ${createdOscillators.length}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 9: Suspended Context & Autoplay Resilience
  // -------------------------------------------------------------------------
  await runner.test('9.1: Suspended AudioContext triggers non-blocking resume and does not crash', () => {
    soundSettings.resetToDefaults();
    _testing.resetRateLimiter();

    const audioCtx = _testing.getSharedAudioContext() as unknown as MockAudioContext;
    if (audioCtx) {
      audioCtx.state = 'suspended';
      audioCtx.resumed = false;
    }

    // Playback should attempt resume and not throw
    sounds.click();
    if (audioCtx && !audioCtx.resumed) {
      throw new Error('AudioContext.resume() was not triggered on suspended state');
    }
  });

  // -------------------------------------------------------------------------
  // Test 10: Oscillator and Gain Node Lifecycle Cleanup
  // -------------------------------------------------------------------------
  await runner.test('10.1: Oscillator and Gain nodes disconnect upon playback conclusion', async () => {
    soundSettings.resetToDefaults();
    _testing.resetRateLimiter();
    createdOscillators = [];
    createdGainNodes = [];

    // Trigger click sound
    sounds.click();

    const osc = createdOscillators[createdOscillators.length - 1];
    if (!osc) {
      throw new Error('No oscillator created for click');
    }

    // Simulate playback conclusion
    await new Promise(resolve => setTimeout(resolve, 20));

    if (!osc.isDisconnected) {
      throw new Error('Oscillator node was not disconnected after playback ended');
    }
  });

  // -------------------------------------------------------------------------
  // Test 11: Semantic Bug Fix Verification
  // -------------------------------------------------------------------------
  await runner.test('11.1: notify.success invokes sounds.success and notify.edit invokes sounds.edit', () => {
    const notifyPath = path.resolve(process.cwd(), 'lib/notify.ts');
    const notifySrc = fs.readFileSync(notifyPath, 'utf8');

    // Verify notify.success contains safePlaySound(sounds.success)
    const successBlock = notifySrc.match(/success:\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/);
    if (!successBlock || !successBlock[1].includes('safePlaySound(sounds.success)')) {
      throw new Error(`notify.success does not call safePlaySound(sounds.success). Found: ${successBlock ? successBlock[1] : 'none'}`);
    }

    // Verify notify.edit contains safePlaySound(sounds.edit)
    const editBlock = notifySrc.match(/edit:\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/);
    if (!editBlock || !editBlock[1].includes('safePlaySound(sounds.edit)')) {
      throw new Error(`notify.edit does not call safePlaySound(sounds.edit)`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 12: Preview Behavior Respects Mute and Volume
  // -------------------------------------------------------------------------
  await runner.test('12.1: Settings preview actions respect master mute and category mute', () => {
    soundSettings.resetToDefaults();

    // 1. When master mute is ON, isSoundAllowed returns false
    soundSettings.setMasterMute(true);
    if (soundSettings.isSoundAllowed('paymentReceived') !== false) {
      throw new Error('Preview not blocked when masterMute is active');
    }

    // 2. When master mute is OFF but category is disabled, preview is blocked
    soundSettings.setMasterMute(false);
    soundSettings.setCategoryEnabled('paymentReceived', false);
    if (soundSettings.isSoundAllowed('paymentReceived') !== false) {
      throw new Error('Preview not blocked when paymentReceived category is disabled');
    }

    // 3. When both are enabled, preview is allowed
    soundSettings.setCategoryEnabled('paymentReceived', true);
    if (soundSettings.isSoundAllowed('paymentReceived') !== true) {
      throw new Error('Preview was blocked despite both master and category being enabled');
    }
  });

  // -------------------------------------------------------------------------
  // Test 13: Acoustic Executive Preset Verification & Waveform Safety
  // -------------------------------------------------------------------------
  await runner.test('13.1: All redesigned presets are callable and error alerts contain zero harsh sawtooth or square waveforms', () => {
    soundSettings.resetToDefaults();
    _testing.resetRateLimiter();

    // 1. Verify Error 1, 2, 3 waveforms are warm sine/triangle (no sawtooth or square)
    createdOscillators = [];
    _testing.resetRateLimiter();
    sounds.error1();
    _testing.resetRateLimiter();
    sounds.error2();
    _testing.resetRateLimiter();
    sounds.error3();

    const harshOsc = createdOscillators.find(osc => osc.type === 'sawtooth' || osc.type === 'square');
    if (harshOsc) {
      throw new Error(`Harsh 8-bit waveform '${harshOsc.type}' detected in error presets`);
    }

    // 2. Verify all presets are callable without throwing
    const presetMethods: (keyof typeof sounds)[] = [
      'notification',
      'login', 'login1', 'login2', 'login3',
      'edit', 'edit1', 'edit2', 'edit3',
      'success', 'success1', 'success2', 'success3',
      'income', 'income1', 'income2', 'income3',
      'expense', 'expense1', 'expense2', 'expense3',
      'delete', 'delete1', 'delete2', 'delete3',
      'mailSend', 'mailSend1', 'mailSend2', 'mailSend3',
      'error', 'error1', 'error2', 'error3',
      'pop', 'click'
    ];

    for (const method of presetMethods) {
      _testing.resetRateLimiter();
      if (typeof sounds[method] !== 'function') {
        throw new Error(`Preset method sounds.${method} is not a function`);
      }
      sounds[method]();
    }
  });

  // -------------------------------------------------------------------------
  // Test 14: Filter Node Lifecycle & Semantic Distinction
  // -------------------------------------------------------------------------
  await runner.test('14.1: BiquadFilterNode applies warm acoustic cutoffs and disconnects properly on conclusion', async () => {
    soundSettings.resetToDefaults();
    _testing.resetRateLimiter();
    createdFilterNodes = [];

    // Trigger notification (warm dual-bell with filter)
    sounds.notification();

    if (createdFilterNodes.length === 0) {
      throw new Error('Expected BiquadFilterNode to be created for acoustic warmth');
    }

    const filter = createdFilterNodes[createdFilterNodes.length - 1];
    if (filter.type !== 'lowpass') {
      throw new Error(`Expected lowpass filter, got: ${filter.type}`);
    }

    // Await conclusion simulation
    await new Promise(resolve => setTimeout(resolve, 20));

    if (!filter.isDisconnected) {
      throw new Error('BiquadFilterNode was not disconnected after playback ended');
    }
  });

  // -------------------------------------------------------------------------
  // Test 15: Unified AudioBuffer Caching & Low-Latency Dispatch
  // -------------------------------------------------------------------------
  await runner.test('15.1: Cached AudioBuffer dispatches via AudioBufferSourceNode directly into masterGainNode', () => {
    soundSettings.resetToDefaults();
    _testing.resetRateLimiter();
    createdBufferSources = [];
    createdOscillators = [];

    // Seed mock AudioBuffer into cache
    const mockBuffer = {} as AudioBuffer;
    _testing.setSampleBuffer('notification', mockBuffer);

    // Trigger notification
    sounds.notification();

    // Should create BufferSource connected to masterGainNode and ZERO oscillators
    if (createdBufferSources.length === 0) {
      throw new Error('Expected AudioBufferSourceNode to be created when sample is cached');
    }
    const source = createdBufferSources[createdBufferSources.length - 1];
    if (!source.isStarted) {
      throw new Error('Expected AudioBufferSourceNode to be started');
    }
    if (createdOscillators.length > 0) {
      throw new Error(`Expected zero procedural oscillators when sample is cached, found: ${createdOscillators.length}`);
    }

    _testing.clearSampleBufferCache();
  });

  // -------------------------------------------------------------------------
  // Test 16: Physical Acoustic Audio Assets & License Manifest Verification
  // -------------------------------------------------------------------------
  await runner.test('16.1: All 27 acoustic WAV assets exist with valid RIFF headers and documented manifest', () => {
    const soundsDir = path.resolve(process.cwd(), 'public/sounds');
    if (!fs.existsSync(soundsDir)) {
      throw new Error(`Sounds directory does not exist at: ${soundsDir}`);
    }

    const manifestPath = path.join(soundsDir, 'MANIFEST.md');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('public/sounds/MANIFEST.md is missing');
    }
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    const expectedFiles = [
      'notification.wav',
      'login1.wav', 'login2.wav', 'login3.wav',
      'edit1.wav', 'edit2.wav', 'edit3.wav',
      'success1.wav', 'success2.wav', 'success3.wav',
      'income1.wav', 'income2.wav', 'income3.wav',
      'expense1.wav', 'expense2.wav', 'expense3.wav',
      'delete1.wav', 'delete2.wav', 'delete3.wav',
      'mailSend1.wav', 'mailSend2.wav', 'mailSend3.wav',
      'error1.wav', 'error2.wav', 'error3.wav',
      'click.wav', 'pop.wav'
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(soundsDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Expected audio asset missing from public/sounds: ${file}`);
      }

      const stat = fs.statSync(filePath);
      if (stat.size < 1000) {
        throw new Error(`Audio asset ${file} is suspiciously small: ${stat.size} bytes`);
      }

      // Verify RIFF / WAVE header
      const fd = fs.openSync(filePath, 'r');
      const headerBuf = Buffer.alloc(12);
      fs.readSync(fd, headerBuf, 0, 12, 0);
      fs.closeSync(fd);

      const riff = headerBuf.toString('ascii', 0, 4);
      const wave = headerBuf.toString('ascii', 8, 12);
      if (riff !== 'RIFF' || wave !== 'WAVE') {
        throw new Error(`File ${file} does not have a valid RIFF/WAVE header: riff='${riff}', wave='${wave}'`);
      }

      // Verify manifest documentation
      if (!manifestContent.includes(file)) {
        throw new Error(`Asset ${file} is not documented in public/sounds/MANIFEST.md`);
      }
    }
  });

  // -------------------------------------------------------------------------
  // Test 17: Legacy Setting Key Migration for sound_edit & sound_success
  // -------------------------------------------------------------------------
  await runner.test('17.1: Legacy preferences migrate to sound_edit and sound_success without reset', () => {
    mockLocalStorage.clear();
    _testing.resetRateLimiter();

    // Set legacy keys
    mockLocalStorage.setItem('sound_newLead', 'edit3');
    mockLocalStorage.setItem('sound_leadConverted', 'success2');

    // Trigger edit and success
    sounds.edit();
    sounds.success();

    // Verify migrated
    const migratedEdit = mockLocalStorage.getItem('sound_edit');
    const migratedSuccess = mockLocalStorage.getItem('sound_success');
    if (migratedEdit !== 'edit3') {
      throw new Error(`Legacy sound_newLead was not migrated to sound_edit. Got: ${migratedEdit}`);
    }
    if (migratedSuccess !== 'success2') {
      throw new Error(`Legacy sound_leadConverted was not migrated to sound_success. Got: ${migratedSuccess}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 18: Sound Studio Coverage in SettingsClient
  // -------------------------------------------------------------------------
  await runner.test('18.1: SettingsClient renders controls for all 8 categories including notification and uiClicks', () => {
    const settingsPath = path.resolve(process.cwd(), 'app/settings/SettingsClient.tsx');
    const content = fs.readFileSync(settingsPath, 'utf8');

    const expectedEntries = [
      'notification',
      'edit',
      'success',
      'systemBoot',
      'paymentReceived',
      'expenseLogged',
      'itemDeleted',
      'emailSent',
      'errorAlert',
      'uiClicks'
    ];

    for (const entry of expectedEntries) {
      if (!content.includes(`id: '${entry}'`)) {
        throw new Error(`SettingsClient Sound Studio is missing row entry for id: '${entry}'`);
      }
    }
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------');
  console.log(`Results: ${runner.passed} passed, ${runner.failed} failed out of ${runner.passed + runner.failed} tests.`);
  console.log('------------------------------------------------------------------------\n');

  if (runner.failed > 0) {
    process.exit(1);
  }
}

runTests();
