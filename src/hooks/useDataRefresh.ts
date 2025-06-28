
import { useEffect, useCallback } from 'react';
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
  
  const refreshData = useCallback(() => {
    const now = Date.now();
    const shouldRefresh = !lastFetch || (now - lastFetch) > refreshThreshold;
    
    if (shouldRefresh) {
      fetchData();
    }
  }, [fetchData, lastFetch, refreshThreshold]);

  // Refresh data when screen is focused
  useFocusEffect(refreshData);
  
  // Also refresh on component mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return { refreshData };
};
