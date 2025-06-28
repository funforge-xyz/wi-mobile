
import { useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from './redux';

interface UseDataRefreshOptions {
  fetchData: () => void;
  lastFetch: number;
  refreshThreshold?: number; // in milliseconds, default 5 minutes
}

export const useDataRefresh = ({ 
  fetchData, 
  lastFetch, 
  refreshThreshold = 5 * 60 * 1000 // 5 minutes 
}: UseDataRefreshOptions) => {
  const dispatch = useAppDispatch();
  const previousLastFetch = useRef(lastFetch);
  
  const refreshData = useCallback(() => {
    const now = Date.now();
    
    // If lastFetch was reset to 0 (data was cleared), always refresh
    // Or if enough time has passed since last fetch
    const dataWasCleared = lastFetch === 0 && previousLastFetch.current > 0;
    const timeThresholdExceeded = lastFetch > 0 && (now - lastFetch) > refreshThreshold;
    const noDataYet = lastFetch === 0 && previousLastFetch.current === 0;
    
    if (dataWasCleared || timeThresholdExceeded || noDataYet) {
      console.log('Refreshing data:', { dataWasCleared, timeThresholdExceeded, noDataYet, lastFetch, previousLastFetch: previousLastFetch.current });
      fetchData();
    }
    
    previousLastFetch.current = lastFetch;
  }, [fetchData, lastFetch, refreshThreshold]);

  // Refresh data when screen is focused
  useFocusEffect(refreshData);
  
  // Also refresh on component mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return { refreshData };
};
