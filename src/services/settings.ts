import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  sameNetworkMatching: boolean;
  trackingRadius: number; // in meters
  locationTrackingEnabled: boolean;
  pushNotificationsEnabled: boolean;
  darkMode: boolean;
}

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
      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }
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
    await this.saveSettings({ darkMode: enabled });
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