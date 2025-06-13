import { apiService } from './apiService';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Initializes the application by:
 * 1. Checking API connectivity
 * 2. Setting up logging
 * 3. Loading initial settings
 */
export const initializeApp = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    console.log('Initializing application...');
    
    // Log important environment info
    console.log(`Environment: ${import.meta.env.MODE}`);
    console.log(`API URL: ${import.meta.env.VITE_API_URL || '/api'}`);
    console.log(`Debug Mode: ${import.meta.env.VITE_DEBUG_MODE}`);
    console.log(`Demo Mode: ${import.meta.env.VITE_DEMO_MODE}`);
    
    // Check API connectivity
    console.log('Checking API connectivity...');
    const connectionResult = await apiService.testConnection();
    
    if (!connectionResult.success) {
      // If API is unavailable, we'll use demo mode if enabled
      const settings = useSettingsStore.getState().settings;
      
      if (settings.demoMode) {
        console.log('API unavailable but demo mode is enabled. Continuing with demo data.');
        return { 
          success: true, 
          message: 'API unavailable, running in demo mode',
        };
      }
      
      console.error('API connectivity check failed:', connectionResult.error);
      return { 
        success: false, 
        error: `No se pudo conectar al backend: ${connectionResult.error}`,
      };
    }
    
    console.log('API connectivity check successful');
    return { success: true };
  } catch (error) {
    console.error('Error initializing app:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al inicializar'
    };
  }
};