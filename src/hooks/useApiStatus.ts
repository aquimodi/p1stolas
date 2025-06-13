import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export type ApiStatus = 'idle' | 'checking' | 'connected' | 'failed';

export const useApiStatus = (
  checkInterval: number = 30000, // Check every 30 seconds by default
  initialCheck: boolean = true // Whether to check immediately
): {
  status: ApiStatus;
  lastChecked: Date | null;
  checkNow: () => Promise<void>;
  error: string | null;
} => {
  const [status, setStatus] = useState<ApiStatus>(initialCheck ? 'checking' : 'idle');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const checkConnection = async () => {
    try {
      setStatus('checking');
      const result = await apiService.testConnection();
      
      if (result.success) {
        setStatus('connected');
        setError(null);
      } else {
        setStatus('failed');
        setError(result.error || 'Unknown error');
      }
      
      setLastChecked(new Date());
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLastChecked(new Date());
    }
  };
  
  useEffect(() => {
    // Check immediately if initialCheck is true
    if (initialCheck) {
      checkConnection();
    }
    
    // Set up interval for periodic checks
    const intervalId = setInterval(checkConnection, checkInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [checkInterval, initialCheck]);
  
  return {
    status,
    lastChecked,
    checkNow: checkConnection,
    error
  };
};