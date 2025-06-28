
import { useEffect, useState, useCallback } from 'react';
import { wifiService, WifiInfo } from '../services/wifiService';
import { locationService } from '../services/locationService';

export const useNetworkMonitoring = () => {
  const [wifiInfo, setWifiInfo] = useState<WifiInfo | null>(null);
  const [isNetworkMonitoring, setIsNetworkMonitoring] = useState(false);

  const handleNetworkChange = useCallback(async (newWifiInfo: WifiInfo) => {
    setWifiInfo(newWifiInfo);
    
    // Update location service when network changes
    if (locationService.isLocationTrackingActive()) {
      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        // This will trigger a Firestore update with new network info
        console.log('Network changed, updating location with new network info');
      }
    }
  }, []);

  const startNetworkMonitoring = useCallback(() => {
    if (!isNetworkMonitoring) {
      wifiService.addNetworkChangeListener(handleNetworkChange);
      setIsNetworkMonitoring(true);
      
      // Get initial network info
      wifiService.getCurrentWifiInfo().then(setWifiInfo);
    }
  }, [isNetworkMonitoring, handleNetworkChange]);

  const stopNetworkMonitoring = useCallback(() => {
    if (isNetworkMonitoring) {
      wifiService.removeNetworkChangeListener(handleNetworkChange);
      setIsNetworkMonitoring(false);
    }
  }, [isNetworkMonitoring, handleNetworkChange]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      wifiService.removeNetworkChangeListener(handleNetworkChange);
    };
  }, [handleNetworkChange]);

  return {
    wifiInfo,
    isNetworkMonitoring,
    startNetworkMonitoring,
    stopNetworkMonitoring,
    networkQuality: wifiInfo ? wifiService.getNetworkQuality() : 'unknown',
    isOnSameNetwork: (networkId: string | null) => wifiService.isOnSameNetwork(networkId),
  };
};
