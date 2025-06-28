import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface WifiInfo {
  networkId: string | null;
  isConnected: boolean;
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
      const ssid = details?.ssid || null;

      return {
        networkId: ssid,
        isConnected: true,
        lastUpdated: new Date(),
      };
    }

    return this.getEmptyWifiInfo();
  }

  private getEmptyWifiInfo(): WifiInfo {
    return {
      networkId: null,
      isConnected: false,
      lastUpdated: new Date(),
    };
  }

  // Start real-time network monitoring
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
  }

  stopNetworkMonitoring(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.isMonitoring = false;
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
      old.isConnected !== current.isConnected
    );
  }

  // Get cached network info
  getCachedWifiInfo(): WifiInfo | null {
    return this.currentWifiInfo;
  }

  // Check if currently on same network as given networkId
  isOnSameNetwork(networkId: string | null): boolean {
    if (!networkId || !this.currentWifiInfo) return false;
    return this.currentWifiInfo.networkId === networkId;
  }
}

export const wifiService = WifiService.getInstance();