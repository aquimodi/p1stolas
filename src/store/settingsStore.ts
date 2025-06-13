import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, AIProvider } from '../types';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateAIProvider: (aiProvider: Partial<AIProvider>) => void;
  resetSettings: () => void;
}

const DEFAULT_AI_PROVIDER: AIProvider = {
  name: 'MistralAI',
  apiKey: '',
  model: 'mistral-large-latest',
};

const DEFAULT_SETTINGS: AppSettings = {
  ocrMethod: 'ai',
  excelParserMethod: 'javascript',
  theme: 'light',
  language: 'es',
  authProvider: 'azure',
  demoMode: true, // Por defecto usamos datos de demo
  debugMode: false, // Modo debug desactivado por defecto
  aiProvider: DEFAULT_AI_PROVIDER,
  azureSettings: {
    tenantId: 'your-tenant-id',
    clientId: 'your-client-id',
    redirectUri: 'https://app.datacenter-manager.com/auth/callback',
    useGraphApi: true
  },
  automations: {
    emailAlerts: true,
    dailyReports: true,
    incidentNotifications: true
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      updateAIProvider: (aiProviderSettings) => set((state) => ({
        settings: { 
          ...state.settings, 
          aiProvider: { ...state.settings.aiProvider, ...aiProviderSettings }
        }
      })),
      
      resetSettings: () => set({ settings: DEFAULT_SETTINGS })
    }),
    {
      name: 'datacenter-app-settings'
    }
  )
);