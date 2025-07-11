import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  sameNetworkMatching: boolean;
  trackingRadius: number; // in meters
  locationTrackingEnabled: boolean;
  pushNotificationsEnabled: boolean;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  sameNetworkMatching: true,
  trackingRadius: 100,
  locationTrackingEnabled: false,
  pushNotificationsEnabled: true,
  darkMode: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  sameNetworkMatching: false,
  trackingRadius: 1,
  locationTrackingEnabled: false,
  pushNotificationsEnabled: true,
  darkMode: false,
};

export class SettingsService {
  private static instance: SettingsService;
  private settings: AppSettings = DEFAULT_SETTINGS;

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  async loadSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem('app_settings');
      console.log('SettingsService: Raw settings from storage:', settingsJson);
      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }
      console.log('SettingsService: Final settings:', this.settings);
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async setSameNetworkMatching(enabled: boolean): Promise<void> {
    await this.saveSettings({ sameNetworkMatching: enabled });
  }

  async getSameNetworkMatching(): Promise<boolean> {
    const settings = await this.loadSettings();
    return settings.sameNetworkMatching;
  }

  async setTrackingRadius(radius: number): Promise<void> {
    await this.saveSettings({ trackingRadius: radius });
  }

  async getTrackingRadius(): Promise<number> {
    const settings = await this.loadSettings();
    return settings.trackingRadius;
  }

  async setLocationTracking(enabled: boolean): Promise<void> {
    await this.saveSettings({ locationTrackingEnabled: enabled });
  }

  async getLocationTracking(): Promise<boolean> {
    const settings = await this.loadSettings();
    return settings.locationTrackingEnabled;
  }

  async setPushNotifications(enabled: boolean): Promise<void> {
    await this.saveSettings({ pushNotificationsEnabled: enabled });
  }

  async getPushNotifications(): Promise<boolean> {
    const settings = await this.loadSettings();
    return settings.pushNotificationsEnabled;
  }

  async setDarkMode(enabled: boolean): Promise<void> {
    console.log('SettingsService: Setting dark mode to:', enabled);
    await this.saveSettings({ darkMode: enabled });
    console.log('SettingsService: Dark mode saved successfully');
  }

  async getDarkMode(): Promise<boolean> {
    const settings = await this.loadSettings();
    return settings.darkMode;
  }

  getSettings(): AppSettings {
    return this.settings;
  }
}

export const settingsService = SettingsService.getInstance();