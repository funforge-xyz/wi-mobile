
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export interface WifiInfo {
  networkId: string | null;
  ssid: string | null;
  bssid: string | null;
  isConnected: boolean;
  signal: number | null;
  frequency: number | null;
  ipAddress: string | null;
  isVpnActive: boolean;
  lastUpdated: Date;
}

export interface NetworkChangeCallback {
  (wifiInfo: WifiInfo): void;
}

export class WifiService {
  private static instance: WifiService;
  private listeners: Set<NetworkChangeCallback> = new Set();
  private unsubscribeNetInfo: (() => void) | null = null;
  private currentWifiInfo: WifiInfo | null = null;
  private isMonitoring = false;

  static getInstance(): WifiService {
    if (!WifiService.instance) {
      WifiService.instance = new WifiService();
    }
    return WifiService.instance;
  }

  async getCurrentWifiInfo(): Promise<WifiInfo> {
    try {
      const netInfo = await NetInfo.fetch();
      const wifiInfo = this.parseNetInfoState(netInfo);
      this.currentWifiInfo = wifiInfo;
      return wifiInfo;
    } catch (error) {
      console.error('Error getting WiFi info:', error);
      return this.getEmptyWifiInfo();
    }
  }

  private parseNetInfoState(netInfo: NetInfoState): WifiInfo {
    if (netInfo.type === 'wifi' && netInfo.isConnected) {
      const details = netInfo.details as any;
      
      // Generate a more robust network ID
      const ssid = details?.ssid || null;
      const bssid = details?.bssid || null;
      const networkId = this.generateNetworkId(ssid, bssid);

      return {
        networkId,
        ssid,
        bssid,
        isConnected: true,
        signal: details?.strength || null,
        frequency: details?.frequency || null,
        ipAddress: details?.ipAddress || null,
        isVpnActive: netInfo.details?.isConnectionExpensive === true,
        lastUpdated: new Date(),
      };
    }
    
    return this.getEmptyWifiInfo();
  }

  private generateNetworkId(ssid: string | null, bssid: string | null): string | null {
    if (!ssid) return null;
    
    // Use BSSID if available for more unique identification
    if (bssid && Platform.OS === 'android') {
      return `${ssid}_${bssid}`;
    }
    
    // Fallback to SSID only (iOS limitation)
    return ssid;
  }

  private getEmptyWifiInfo(): WifiInfo {
    return {
      networkId: null,
      ssid: null,
      bssid: null,
      isConnected: false,
      signal: null,
      frequency: null,
      ipAddress: null,
      isVpnActive: false,
      lastUpdated: new Date(),
    };
  }

  // Start real-time network monitoring (Flutter-style)
  startNetworkMonitoring(): void {
    if (this.isMonitoring) return;

    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const newWifiInfo = this.parseNetInfoState(state);
      
      // Only notify if network actually changed
      if (this.hasNetworkChanged(this.currentWifiInfo, newWifiInfo)) {
        this.currentWifiInfo = newWifiInfo;
        this.notifyListeners(newWifiInfo);
      }
    });

    this.isMonitoring = true;
    console.log('Network monitoring started');
  }

  stopNetworkMonitoring(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.isMonitoring = false;
    console.log('Network monitoring stopped');
  }

  // Add listener for network changes
  addNetworkChangeListener(callback: NetworkChangeCallback): void {
    this.listeners.add(callback);
    
    // Start monitoring when first listener is added
    if (this.listeners.size === 1) {
      this.startNetworkMonitoring();
    }
  }

  removeNetworkChangeListener(callback: NetworkChangeCallback): void {
    this.listeners.delete(callback);
    
    // Stop monitoring when no listeners remain
    if (this.listeners.size === 0) {
      this.stopNetworkMonitoring();
    }
  }

  private notifyListeners(wifiInfo: WifiInfo): void {
    this.listeners.forEach(callback => {
      try {
        callback(wifiInfo);
      } catch (error) {
        console.error('Error in network change callback:', error);
      }
    });
  }

  private hasNetworkChanged(old: WifiInfo | null, current: WifiInfo): boolean {
    if (!old) return true;
    
    return (
      old.networkId !== current.networkId ||
      old.isConnected !== current.isConnected ||
      old.ssid !== current.ssid
    );
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

  // Get cached network info (faster)
  getCachedWifiInfo(): WifiInfo | null {
    return this.currentWifiInfo;
  }

  // Check if currently on same network as given networkId
  isOnSameNetwork(networkId: string | null): boolean {
    if (!networkId || !this.currentWifiInfo) return false;
    return this.currentWifiInfo.networkId === networkId;
  }

  // Network quality assessment
  getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    if (!this.currentWifiInfo?.signal) return 'unknown';
    
    const signal = this.currentWifiInfo.signal;
    if (signal >= -50) return 'excellent';
    if (signal >= -60) return 'good';
    if (signal >= -70) return 'fair';
    return 'poor';
  }
}

export const wifiService = WifiService.getInstance();
