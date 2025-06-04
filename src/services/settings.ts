
import AsyncStorage from '@react-native-async-storage/async-storage';

export class Settings {
  private static readonly ONBOARDING_DONE_KEY = 'onboarding_done';
  private static readonly DARK_MODE_KEY = 'dark_mode';

  async setOnboardingDone(value: boolean): Promise<void> {
    await AsyncStorage.setItem(this.ONBOARDING_DONE_KEY, JSON.stringify(value));
  }

  async getOnboardingDone(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.ONBOARDING_DONE_KEY);
      return value ? JSON.parse(value) : false;
    } catch {
      return false;
    }
  }

  async setDarkMode(value: boolean): Promise<void> {
    await AsyncStorage.setItem(this.DARK_MODE_KEY, JSON.stringify(value));
  }

  async getDarkMode(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.DARK_MODE_KEY);
      return value ? JSON.parse(value) : false;
    } catch {
      return false;
    }
  }
}
