import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeApp } from './services/appInitializer.ts';
import { useSettingsStore } from './store/settingsStore.ts';

// Initial setup component
const AppInitializer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        const result = await initializeApp();
        
        if (!result.success) {
          setInitError(result.error || 'Error al inicializar la aplicación');
          console.error('Initialization error:', result.error);
          
          // Still set initialized to true so the app loads, but with error state
          setIsInitialized(true);
        } else {
          setIsInitialized(true);
          if (result.message) {
            console.log('Initialization message:', result.message);
          }
        }
      } catch (error) {
        setInitError(error instanceof Error ? error.message : 'Error desconocido');
        console.error('Unexpected initialization error:', error);
        setIsInitialized(true);
      }
    };
    
    initialize();
  }, []);
  
  // If in debug mode, add more detailed error info
  useEffect(() => {
    if (initError && import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.group('Debug Information');
      console.log('API URL:', import.meta.env.VITE_API_URL);
      console.log('Settings:', useSettingsStore.getState().settings);
      console.groupEnd();
    }
  }, [initError]);
  
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Iniciando aplicación...</h2>
          <p className="text-gray-600">Cargando configuración y conectando al backend</p>
        </div>
      </div>
    );
  }
  
  if (initError) {
    const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (demoMode) {
      // If in demo mode, show warning but allow to continue
      return (
        <>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 fixed top-0 left-0 right-0 z-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Advertencia:</strong> No se pudo conectar al backend. La aplicación está funcionando en modo demo.
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Error: {initError}
                </p>
              </div>
            </div>
          </div>
          <App />
        </>
      );
    }
    
    // If not in demo mode, show error screen
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg">
          <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4 text-red-700">Error de conexión</h2>
          <p className="text-gray-700 mb-6">{initError}</p>
          <div className="bg-gray-100 p-4 rounded-md text-sm text-left mb-6">
            <p className="font-semibold mb-2">Posibles soluciones:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verifica que el servidor backend está en ejecución</li>
              <li>Comprueba la configuración de VITE_API_URL en el archivo .env</li>
              <li>Asegúrate de que no hay problemas de CORS</li>
              <li>Activa el modo debug para más información</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer />
  </StrictMode>
);