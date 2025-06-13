import { apiService } from '../services/apiService';

/**
 * Utility to check API connectivity
 * This can be used to verify if the backend is reachable
 */
export const checkApiConnectivity = async (
  setStatusCallback?: (status: 'checking' | 'connected' | 'failed') => void
): Promise<{
  success: boolean;
  error?: string;
  details?: any;
  statusCode?: number;
}> => {
  // If callback provided, set status to checking
  if (setStatusCallback) {
    setStatusCallback('checking');
  }
  
  try {
    // Log the attempt
    console.log('Checking API connectivity...');
    
    // Try to call the health endpoint
    const result = await apiService.healthCheck();
    
    // Log the result with more details
    console.log('API connectivity check result:', {
      success: result.success,
      statusCode: result.statusCode,
      details: result.data || result.error
    });
    
    if (result.success) {
      // If callback provided, set status to connected
      if (setStatusCallback) {
        setStatusCallback('connected');
      }
      
      return {
        success: true,
        details: result.data
      };
    } else {
      // If callback provided, set status to failed
      if (setStatusCallback) {
        setStatusCallback('failed');
      }
      
      return {
        success: false,
        error: result.error || 'Unknown error',
        statusCode: result.statusCode,
        details: result.details
      };
    }
  } catch (error) {
    console.error('API connectivity check failed with exception:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // If callback provided, set status to failed
    if (setStatusCallback) {
      setStatusCallback('failed');
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Utility to periodically check API connectivity
 * Useful for showing connectivity status in the UI
 */
export const startApiConnectivityCheck = (
  intervalMs: number,
  setStatusCallback: (status: 'checking' | 'connected' | 'failed') => void
): () => void => {
  // First check immediately
  checkApiConnectivity(setStatusCallback);
  
  // Then set up interval
  const intervalId = setInterval(
    () => checkApiConnectivity(setStatusCallback), 
    intervalMs
  );
  
  // Return a cleanup function
  return () => clearInterval(intervalId);
};