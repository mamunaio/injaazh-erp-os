/**
 * Centralized Sound Settings & State Management for Injaazh ERP OS.
 * Provides persistent configuration for master mute, volume level, and category toggles
 * with multi-tab synchronization and SSR/headless resilience.
 */

export type SoundCategory =
  | 'systemBoot'
  | 'paymentReceived'
  | 'expenseLogged'
  | 'itemDeleted'
  | 'emailSent'
  | 'errorAlert'
  | 'notification'
  | 'uiClicks';

export interface SoundSettings {
  masterMute: boolean;
  masterVolume: number; // 0 to 100
  events: Record<SoundCategory, boolean>;
}

export const SOUND_STORAGE_KEYS = {
  MASTER_MUTE: 'injaazh_sound_master_mute',
  MASTER_VOLUME: 'injaazh_sound_master_volume',
  EVENTS: 'injaazh_sound_events',
} as const;

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  masterMute: false,
  masterVolume: 50,
  events: {
    systemBoot: true,
    paymentReceived: true,
    expenseLogged: true,
    itemDeleted: true,
    emailSent: true,
    errorAlert: true,
    notification: true,
    uiClicks: true,
  },
};

type Listener = (settings: SoundSettings) => void;

class SoundSettingsManager {
  private currentSettings: SoundSettings;
  private listeners: Set<Listener> = new Set();
  private storageListenerAttached = false;

  constructor() {
    this.currentSettings = this.loadInitialSettings();
    this.ensureStorageListener();
  }

  private ensureStorageListener(): void {
    if (this.storageListenerAttached) return;
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('storage', (event: any) => {
        if (
          event.key === SOUND_STORAGE_KEYS.MASTER_MUTE ||
          event.key === SOUND_STORAGE_KEYS.MASTER_VOLUME ||
          event.key === SOUND_STORAGE_KEYS.EVENTS
        ) {
          this.refreshFromStorage();
        }
      });
      this.storageListenerAttached = true;
    }
  }

  private getStorage(): Storage | null {
    this.ensureStorageListener();
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  private safeGetItem(key: string): string | null {
    try {
      const storage = this.getStorage();
      return storage ? storage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  private safeSetItem(key: string, value: string): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(key, value);
      }
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  private loadInitialSettings(): SoundSettings {
    const settings: SoundSettings = {
      masterMute: DEFAULT_SOUND_SETTINGS.masterMute,
      masterVolume: DEFAULT_SOUND_SETTINGS.masterVolume,
      events: { ...DEFAULT_SOUND_SETTINGS.events },
    };

    // 1. Master Mute
    const storedMute = this.safeGetItem(SOUND_STORAGE_KEYS.MASTER_MUTE);
    if (storedMute !== null) {
      settings.masterMute = storedMute === 'true';
    }

    // 2. Master Volume (0-100)
    const storedVol = this.safeGetItem(SOUND_STORAGE_KEYS.MASTER_VOLUME);
    if (storedVol !== null) {
      const parsed = parseFloat(storedVol);
      if (!isNaN(parsed) && isFinite(parsed)) {
        // If stored as normalized 0.0-1.0, convert to 0-100 percentage
        const normalized = parsed <= 1 && parsed > 0 ? Math.round(parsed * 100) : parsed;
        settings.masterVolume = Math.max(0, Math.min(100, Math.round(normalized)));
      }
    }

    // 3. Category Mutes
    const storedEvents = this.safeGetItem(SOUND_STORAGE_KEYS.EVENTS);
    if (storedEvents) {
      try {
        const parsed = JSON.parse(storedEvents);
        if (parsed && typeof parsed === 'object') {
          for (const key of Object.keys(DEFAULT_SOUND_SETTINGS.events) as SoundCategory[]) {
            if (typeof parsed[key] === 'boolean') {
              settings.events[key] = parsed[key];
            }
          }
        }
      } catch {
        // Corrupted JSON in localStorage; preserve defaults
      }
    }

    return settings;
  }

  public getSoundSettings(): SoundSettings {
    return {
      masterMute: this.currentSettings.masterMute,
      masterVolume: this.currentSettings.masterVolume,
      events: { ...this.currentSettings.events },
    };
  }

  public isMasterMuted(): boolean {
    return this.currentSettings.masterMute;
  }

  public getMasterVolume(): number {
    return this.currentSettings.masterVolume;
  }

  public isCategoryEnabled(category?: SoundCategory): boolean {
    if (this.currentSettings.masterMute) return false;
    if (!category) return true;
    return this.currentSettings.events[category] !== false;
  }

  public isSoundAllowed(category?: SoundCategory): boolean {
    return this.isCategoryEnabled(category);
  }

  public setMasterMute(mute: boolean): void {
    const validated = Boolean(mute);
    if (this.currentSettings.masterMute === validated) return;
    this.currentSettings.masterMute = validated;
    this.safeSetItem(SOUND_STORAGE_KEYS.MASTER_MUTE, String(validated));
    this.notifyListeners();
  }

  public setMasterVolume(volume: number): void {
    const num = Number(volume);
    if (isNaN(num) || !isFinite(num)) return;
    // Allow input as 0.0 - 1.0 or 0 - 100
    const normalized = num <= 1 && num > 0 ? Math.round(num * 100) : num;
    const clamped = Math.max(0, Math.min(100, Math.round(normalized)));
    if (this.currentSettings.masterVolume === clamped) return;
    this.currentSettings.masterVolume = clamped;
    this.safeSetItem(SOUND_STORAGE_KEYS.MASTER_VOLUME, String(clamped));
    this.notifyListeners();
  }

  public setCategoryEnabled(category: SoundCategory, enabled: boolean): void {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SOUND_SETTINGS.events, category)) return;
    const validated = Boolean(enabled);
    if (this.currentSettings.events[category] === validated) return;
    this.currentSettings.events[category] = validated;
    this.safeSetItem(SOUND_STORAGE_KEYS.EVENTS, JSON.stringify(this.currentSettings.events));
    this.notifyListeners();
  }

  public setAllSettings(partial: Partial<SoundSettings>): void {
    let changed = false;

    if (typeof partial.masterMute === 'boolean' && partial.masterMute !== this.currentSettings.masterMute) {
      this.currentSettings.masterMute = partial.masterMute;
      this.safeSetItem(SOUND_STORAGE_KEYS.MASTER_MUTE, String(partial.masterMute));
      changed = true;
    }

    if (typeof partial.masterVolume === 'number') {
      const num = partial.masterVolume;
      const normalized = num <= 1 && num > 0 ? Math.round(num * 100) : num;
      const clamped = Math.max(0, Math.min(100, Math.round(normalized)));
      if (clamped !== this.currentSettings.masterVolume) {
        this.currentSettings.masterVolume = clamped;
        this.safeSetItem(SOUND_STORAGE_KEYS.MASTER_VOLUME, String(clamped));
        changed = true;
      }
    }

    if (partial.events && typeof partial.events === 'object') {
      let eventsChanged = false;
      for (const key of Object.keys(DEFAULT_SOUND_SETTINGS.events) as SoundCategory[]) {
        if (typeof partial.events[key] === 'boolean' && partial.events[key] !== this.currentSettings.events[key]) {
          this.currentSettings.events[key] = partial.events[key];
          eventsChanged = true;
        }
      }
      if (eventsChanged) {
        this.safeSetItem(SOUND_STORAGE_KEYS.EVENTS, JSON.stringify(this.currentSettings.events));
        changed = true;
      }
    }

    if (changed) {
      this.notifyListeners();
    }
  }

  public refreshFromStorage(): void {
    const updated = this.loadInitialSettings();
    this.currentSettings = updated;
    this.notifyListeners();
  }

  public resetToDefaults(): void {
    this.currentSettings = {
      masterMute: DEFAULT_SOUND_SETTINGS.masterMute,
      masterVolume: DEFAULT_SOUND_SETTINGS.masterVolume,
      events: { ...DEFAULT_SOUND_SETTINGS.events },
    };
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(SOUND_STORAGE_KEYS.MASTER_MUTE);
        storage.removeItem(SOUND_STORAGE_KEYS.MASTER_VOLUME);
        storage.removeItem(SOUND_STORAGE_KEYS.EVENTS);
      }
    } catch {}
    this.notifyListeners();
  }

  public subscribeSoundSettings(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getSoundSettings();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        // Listener error safety
      }
    });

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('injaazh-sound-settings-changed', {
            detail: snapshot,
          })
        );
      } catch {}
    }
  }
}

export const soundSettings = new SoundSettingsManager();
