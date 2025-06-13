export interface Project {
  id: string;
  deliveryDate: string;
  datacenter: string;
  projectName: string;
  client: string;
  ritmCode: string;
  projectCode: string;
  estimatedEquipment: number;
  status: 'Pendiente' | 'En Progreso' | 'Completado';
  progress: number;
  teamsUrl: string;
  excelPath: string;
  createdAt: string;
  orders: Order[];
  estimatedEquipmentList?: EstimatedEquipment[];
  ocrMethod?: string;
}

export interface Order {
  id: string;
  code: string;
  projectId: string;
  estimatedEquipment: number;
  progress: number;
  deliveryNotes: DeliveryNote[];
}

export interface DeliveryNote {
  id: string;
  code: string;
  orderId: string;
  estimatedEquipment: number;
  deliveredEquipment: number;
  verifiedEquipment: number;
  status: 'Pendiente' | 'Validando Albarán' | 'Validando Recepción' | 'Completado';
  progress: number;
  attachmentPath: string;
  attachmentType: 'pdf' | 'excel' | 'image' | 'doc';
  equipments: Equipment[];
}

export interface Equipment {
  id: string;
  deliveryNoteId: string | null;
  name: string;
  serialNumber: string;
  partNumber: string;
  deviceName: string;
  type: string;
  model: string;
  isVerified: boolean;
  photoPath: string | null;
  isMatched: boolean;
  matchedWithId: string | null;
  estimatedEquipmentId: string | null;
}

export interface IncidentComment {
  id: string;
  date: string;
  text: string;
  author: string;
  photoPath: string | null;
}

export interface Incident {
  id: string;
  equipmentId: string;
  description: string;
  status: 'Pendiente' | 'En Revisión' | 'Resuelto';
  createdAt: string;
  photoPath: string | null;
  comments?: IncidentComment[];
  resolution?: {
    date: string;
    description: string;
    technician: string;
  };
}

export interface EstimatedEquipment {
  id: string;
  projectId: string;
  type: string;
  model: string;
  quantity: number;
  assignedEquipmentCount: number;
}

export interface DeviceNameDB {
  id: string;
  prefix: string;
  datacenter: string;
  lastNumber: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  location: string;
  lastLogin: string;
  isActive: boolean;
  userGroupId: string;
  passwordHash?: string;
}

export type UserRole = 'admin' | 'manager' | 'technician' | 'viewer';

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  memberCount: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

// AI Provider configurations
export interface AIProvider {
  name: 'OpenAI' | 'AzureOpenAI' | 'MistralAI';
  apiKey: string;
  model: string;
  endpoint?: string; // For Azure OpenAI, we need a custom endpoint
  version?: string; // For versioned APIs
}

export interface AppSettings {
  ocrMethod: 'ai' | 'scribe';  // Changed from 'mistral' to 'ai' to be provider-agnostic
  excelParserMethod: 'ai' | 'javascript'; // Changed from 'mistral' to 'ai'
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  authProvider: 'azure' | 'local';
  demoMode: boolean;  // Modo de demostración (datos dummy vs reales)
  debugMode: boolean; // Modo de depuración para ver interacciones backend-frontend
  aiProvider: AIProvider; // New field for AI provider configuration
  azureSettings: {
    tenantId: string;
    clientId: string;
    redirectUri: string;
    useGraphApi: boolean;
  };
  automations: {
    emailAlerts: boolean;
    dailyReports: boolean;
    incidentNotifications: boolean;
  };
}

// Types for Tests
export type TestStatus = 'idle' | 'running' | 'success' | 'failed' | 'warning';

export interface TestLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

export interface TestItem {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  progress: number;
  duration?: number;
  logs: TestLog[];
  category: 'frontend' | 'backend' | 'database' | 'integration' | 'ocr';
  dependencies?: string[]; // IDs of tests that must run before this one
}