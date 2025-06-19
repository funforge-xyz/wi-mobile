
import NetInfo from '@react-native-community/netinfo';

export interface WifiInfo {
  networkId: string | null;
  ssid: string | null;
  isConnected: boolean;
}

export class WifiService {
  private static instance: WifiService;

  static getInstance(): WifiService {
    if (!WifiService.instance) {
      WifiService.instance = new WifiService();
    }
    return WifiService.instance;
  }

  async getCurrentWifiInfo(): Promise<WifiInfo> {
    try {
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.type === 'wifi' && netInfo.isConnected) {
        const ssid = netInfo.details?.ssid || null;
        const networkId = ssid; // Use SSID as network identifier
        
        return {
          networkId,
          ssid,
          isConnected: true,
        };
      }
      
      return {
        networkId: null,
        ssid: null,
        isConnected: false,
      };
    } catch (error) {
      console.error('Error getting WiFi info:', error);
      return {
        networkId: null,
        ssid: null,
        isConnected: false,
      };
    }
  }

  async isWifiEnabled(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.type === 'wifi' && netInfo.isConnected === true;
    } catch (error) {
      console.error('Error checking WiFi status:', error);
      return false;
    }
  }
}

export const wifiService = WifiService.getInstance();
