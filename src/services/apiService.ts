import axios from 'axios';
import { useSettingsStore } from '../store/settingsStore';

// Get API base URL from environment variables with detailed logging
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
console.log('🔧 API Service Configuration:');
console.log('  - API_BASE_URL:', API_BASE_URL);
console.log('  - Environment Mode:', import.meta.env.MODE);
console.log('  - All VITE env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

// Create axios instance with detailed configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to handle API responses
const handleResponse = <T>(response: any): T => {
  return response.data;
};

// Add request interceptor to check for demo mode and log requests
api.interceptors.request.use((config) => {
  const { settings } = useSettingsStore.getState();
  
  // Log request if debug mode is enabled
  if (settings.debugMode || import.meta.env.VITE_DEBUG_MODE === 'true') {
    console.log('%c 🔶 API Request:', 'background: #FFA500; color: white; padding: 2px 6px; border-radius: 2px;', {
      url: config.url,
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
      params: config.params,
      headers: config.headers
    });
  }
  
  // Add demo mode header if enabled
  if (settings.demoMode) {
    config.headers['X-Demo-Mode'] = 'true';
  }
  
  return config;
}, (error) => {
  console.error('%c 🔴 API Request Error:', 'background: #FF5252; color: white; padding: 2px 6px; border-radius: 2px;', error);
  return Promise.reject(error);
});

// Add response interceptor to log responses and handle errors
api.interceptors.response.use(
  (response) => {
    const { settings } = useSettingsStore.getState();
    
    // Log response if debug mode is enabled
    if (settings.debugMode || import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('%c 🟢 API Response:', 'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 2px;', {
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
    }
    
    return response;
  },
  (error) => {
    const { settings } = useSettingsStore.getState();
    
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data
    };
    
    if (settings.debugMode || import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('%c 🔴 API Error:', 'background: #FF5252; color: white; padding: 2px 6px; border-radius: 2px;', errorDetails);
    }
    
    // Network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.error('🔌 Network Error - Backend may be down:', errorDetails);
    }
    
    // CORS errors
    if (error.message.includes('CORS')) {
      console.error('🚫 CORS Error - Check backend CORS configuration:', errorDetails);
    }
    
    return Promise.reject(error);
  }
);

// API service with typed methods and enhanced error handling
export const apiService = {
  // Health check with detailed error reporting
  healthCheck: async () => {
    try {
      console.log('🏥 Sending health check request to:', `${API_BASE_URL}/health`);
      const response = await api.get('/health', { 
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 500 
      });
      
      console.log('🏥 Health check response:', response.data);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      let statusCode = undefined;
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout - server might be down or unreachable';
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Network error - please check your connection and ensure the API server is running';
        } else if (error.response) {
          statusCode = error.response.status;
          errorMessage = `Server responded with status ${statusCode}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'No response received from server - check server status and CORS configuration';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('🏥 Health check failed:', {
        message: errorMessage,
        statusCode,
        originalError: error,
        config: {
          baseURL: API_BASE_URL,
          timeout: 10000
        }
      });
      
      return {
        success: false,
        error: errorMessage,
        statusCode,
        details: error
      };
    }
  },
  
  // Test connection with comprehensive diagnostics
  testConnection: async () => {
    try {
      console.log('🔍 Testing full connection to:', `${API_BASE_URL}/diagnostics/full`);
      const response = await api.get('/diagnostics/full');
      
      console.log('🔍 Connection test response:', response.data);
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('🔍 Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
    }
  },
  
  // Projects
  getAllProjects: async () => {
    const response = await api.get('/projects');
    return handleResponse(response);
  },
  
  getProjectById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return handleResponse(response);
  },
  
  createProject: async (project: any) => {
    const response = await api.post('/projects', project);
    return handleResponse(response);
  },
  
  updateProject: async (id: string, project: any) => {
    const response = await api.put(`/projects/${id}`, project);
    return handleResponse(response);
  },
  
  deleteProject: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return handleResponse(response);
  },
  
  // Orders
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return handleResponse(response);
  },
  
  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return handleResponse(response);
  },
  
  getOrdersByProjectId: async (projectId: string) => {
    const response = await api.get(`/orders/project/${projectId}`);
    return handleResponse(response);
  },
  
  createOrder: async (order: any) => {
    const response = await api.post('/orders', order);
    return handleResponse(response);
  },
  
  updateOrder: async (id: string, order: any) => {
    const response = await api.put(`/orders/${id}`, order);
    return handleResponse(response);
  },
  
  deleteOrder: async (id: string) => {
    const response = await api.delete(`/orders/${id}`);
    return handleResponse(response);
  },
  
  // Delivery Notes
  getAllDeliveryNotes: async () => {
    const response = await api.get('/delivery-notes');
    return handleResponse(response);
  },
  
  getDeliveryNoteById: async (id: string) => {
    const response = await api.get(`/delivery-notes/${id}`);
    return handleResponse(response);
  },
  
  getDeliveryNotesByOrderId: async (orderId: string) => {
    const response = await api.get(`/delivery-notes/order/${orderId}`);
    return handleResponse(response);
  },
  
  createDeliveryNote: async (note: any) => {
    const response = await api.post('/delivery-notes', note);
    return handleResponse(response);
  },
  
  updateDeliveryNote: async (id: string, note: any) => {
    const response = await api.put(`/delivery-notes/${id}`, note);
    return handleResponse(response);
  },
  
  deleteDeliveryNote: async (id: string) => {
    const response = await api.delete(`/delivery-notes/${id}`);
    return handleResponse(response);
  },
  
  // Equipment
  getEquipmentById: async (id: string) => {
    const response = await api.get(`/equipment/${id}`);
    return handleResponse(response);
  },
  
  getEquipmentByDeliveryNoteId: async (deliveryNoteId: string) => {
    const response = await api.get(`/equipment/delivery-note/${deliveryNoteId}`);
    return handleResponse(response);
  },
  
  updateEquipment: async (id: string, equipment: any) => {
    const response = await api.put(`/equipment/${id}`, equipment);
    return handleResponse(response);
  },
  
  matchEquipment: async (id: string, estimatedEquipmentId: string) => {
    const response = await api.post(`/equipment/${id}/match`, { estimatedEquipmentId });
    return handleResponse(response);
  },
  
  unmatchEquipment: async (id: string) => {
    const response = await api.post(`/equipment/${id}/unmatch`);
    return handleResponse(response);
  },
  
  verifyEquipment: async (id: string, photoPath: string) => {
    const response = await api.post(`/equipment/${id}/verify`, { photoPath });
    return handleResponse(response);
  },
  
  // Incidents
  getAllIncidents: async () => {
    const response = await api.get('/incidents');
    return handleResponse(response);
  },
  
  getIncidentById: async (id: string) => {
    const response = await api.get(`/incidents/${id}`);
    return handleResponse(response);
  },
  
  createIncident: async (incident: any) => {
    const response = await api.post('/incidents', incident);
    return handleResponse(response);
  },
  
  updateIncident: async (id: string, incident: any) => {
    const response = await api.put(`/incidents/${id}`, incident);
    return handleResponse(response);
  },
  
  addIncidentComment: async (id: string, comment: any) => {
    const response = await api.post(`/incidents/${id}/comments`, comment);
    return handleResponse(response);
  },
  
  resolveIncident: async (id: string, resolution: any) => {
    const response = await api.post(`/incidents/${id}/resolve`, resolution);
    return handleResponse(response);
  },
  
  // Utils
  analyzeDocument: async (fileBase64: string, fileType: string) => {
    const response = await api.post('/utils/analyze-document', { fileBase64, fileType });
    return handleResponse(response);
  },
  
  generateDeviceName: async (prefix: string, datacenter: string) => {
    const response = await api.get(`/utils/generate-device-name?prefix=${prefix}&datacenter=${datacenter}`);
    return handleResponse<{ deviceName: string }>(response);
  },
  
  exportToExcel: async (projectData: any, equipmentList: any[]) => {
    const response = await api.post('/utils/export-excel', { projectData, equipmentList });
    return handleResponse(response);
  },
  
  // Auth (simplified - no Azure)
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return handleResponse(response);
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return handleResponse(response);
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Set auth header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const response = await api.get('/auth/me');
    return handleResponse(response);
  },
  
  // File uploads
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return handleResponse(response);
  }
};