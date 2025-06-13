import React, { useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  FileText, 
  File, 
  Cpu, 
  Users, 
  ShieldCheck, 
  Bell, 
  Mail,
  UserPlus,
  Lock,
  ToggleLeft,
  Database,
  Bug,
  Braces,
  Key,
  Globe,
  Server,
  TestTube
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { AIProvider } from '../types';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, updateAIProvider, resetSettings } = useSettingsStore();
  const { userGroups, users } = useUserStore();
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'auth' | 'automations' | 'backend' | 'ai'>('general');
  const navigate = useNavigate();

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    
    // Reset saved notification after 3 seconds
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };
  
  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer todos los ajustes a sus valores predeterminados?')) {
      resetSettings();
      setLocalSettings({ ...useSettingsStore.getState().settings });
    }
  };

  const handleAIProviderChange = (name: 'OpenAI' | 'AzureOpenAI' | 'MistralAI') => {
    const newAIProvider: AIProvider = {
      ...localSettings.aiProvider,
      name,
      // Set default model based on provider
      model: name === 'OpenAI' 
        ? 'gpt-4-vision-preview'
        : name === 'AzureOpenAI'
          ? 'gpt-4-vision'
          : 'mistral-large-latest'
    };
    
    setLocalSettings({
      ...localSettings,
      aiProvider: newAIProvider
    });
  };
  
  const handleAIProviderFieldChange = (field: keyof AIProvider, value: string) => {
    setLocalSettings({
      ...localSettings,
      aiProvider: {
        ...localSettings.aiProvider,
        [field]: value
      }
    });
  };

  const navigateToTests = () => {
    navigate('/test');
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-600">Configura las preferencias de la aplicación</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <nav className="flex flex-col">
              <button
                className={`px-4 py-3 text-left flex items-center ${activeTab === 'general' 
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
                  : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => setActiveTab('general')}
              >
                <Cpu className="h-5 w-5 mr-2" />
                <span>General</span>
              </button>
              
              <button
                className={`px-4 py-3 text-left flex items-center ${activeTab === 'ai' 
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
                  : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => setActiveTab('ai')}
              >
                <Braces className="h-5 w-5 mr-2" />
                <span>IA & OCR</span>
              </button>
              
              <button
                className={`px-4 py-3 text-left flex items-center ${activeTab === 'users' 
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
                  : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => setActiveTab('users')}
              >
                <Users className="h-5 w-5 mr-2" />
                <span>Usuarios y Grupos</span>
              </button>
              
              <button
                className={`px-4 py-3 text-left flex items-center ${activeTab === 'auth' 
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
                  : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => setActiveTab('auth')}
              >
                <ShieldCheck className="h-5 w-5 mr-2" />
                <span>Autenticación</span>
              </button>
              
              <button
                className={`px-4 py-3 text-left flex items-center ${activeTab === 'automations' 
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
                  : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => setActiveTab('automations')}
              >
                <Bell className="h-5 w-5 mr-2" />
                <span>Automatizaciones</span>
              </button>
              
              <button
                className={`px-4 py-3 text-left flex items-center ${activeTab === 'backend' 
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-500' 
                  : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => setActiveTab('backend')}
              >
                <Database className="h-5 w-5 mr-2" />
                <span>Backend</span>
              </button>

              <button
                className="px-4 py-3 text-left flex items-center hover:bg-gray-50 text-gray-700"
                onClick={navigateToTests}
              >
                <TestTube className="h-5 w-5 mr-2" />
                <span>Pruebas del Sistema</span>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <Card className="border border-gray-200">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Procesamiento de Documentos</h2>
                  
                  <div className="space-y-6">
                    {/* Excel Parser Method */}
                    <div>
                      <h3 className="text-md font-medium mb-3">Método de Análisis de Excel</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Selecciona el método preferido para analizar archivos Excel cuando creas proyectos o importas datos.
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.excelParserMethod === 'javascript' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setLocalSettings({ ...localSettings, excelParserMethod: 'javascript' })}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.excelParserMethod === 'javascript' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">JavaScript (XLSX)</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Analiza archivos Excel utilizando JavaScript. Más rápido y funciona sin conexión a internet.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.excelParserMethod === 'ai' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setLocalSettings({ ...localSettings, excelParserMethod: 'ai' })}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.excelParserMethod === 'ai' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <Cpu className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">Inteligencia Artificial</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Utiliza inteligencia artificial para analizar los contenidos de archivos Excel. Más preciso pero requiere conexión a internet.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* OCR Method */}
                    <div>
                      <h3 className="text-md font-medium mb-3">Método de OCR para Albaranes</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Selecciona el método predeterminado para análisis OCR de albaranes. Esta configuración se aplicará a todos los proyectos.
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.ocrMethod === 'scribe' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setLocalSettings({ ...localSettings, ocrMethod: 'scribe' })}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.ocrMethod === 'scribe' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <File className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">OCR JavaScript</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Procesamiento local de OCR utilizando Tesseract.js. Funciona sin conexión a internet.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.ocrMethod === 'ai' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setLocalSettings({ ...localSettings, ocrMethod: 'ai' })}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.ocrMethod === 'ai' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <Cpu className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">Inteligencia Artificial</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Utiliza inteligencia artificial para analizar documentos y extraer información. Mayor precisión pero requiere conexión a internet.
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Proveedor actual: {localSettings.aiProvider?.name || 'No configurado'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* AI Provider Settings */}
            {activeTab === 'ai' && (
              <Card className="border border-gray-200">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Configuración de Proveedores de IA</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-3">Proveedor de IA</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Selecciona el proveedor de IA que deseas utilizar para análisis de documentos y OCR.
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.aiProvider.name === 'MistralAI' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => handleAIProviderChange('MistralAI')}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.aiProvider.name === 'MistralAI' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <Braces className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">Mistral AI</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Modelos avanzados de IA multimodal para procesamiento de texto e imágenes.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.aiProvider.name === 'OpenAI' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => handleAIProviderChange('OpenAI')}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.aiProvider.name === 'OpenAI' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <Cpu className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">OpenAI</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Modelos GPT de OpenAI con capacidad de visión para análisis de imágenes y documentos.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.aiProvider.name === 'AzureOpenAI' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => handleAIProviderChange('AzureOpenAI')}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.aiProvider.name === 'AzureOpenAI' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <Server className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">Azure OpenAI</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Modelos de OpenAI alojados en Azure, ideales para empresas con requisitos de cumplimiento.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Provider Configuration */}
                    <div className="mt-6">
                      <h3 className="text-md font-medium mb-3">Configuración de {localSettings.aiProvider.name}</h3>
                      <div className="space-y-4 p-4 border rounded-lg">
                        <Input
                          label="API Key"
                          value={localSettings.aiProvider.apiKey}
                          onChange={(e) => handleAIProviderFieldChange('apiKey', e.target.value)}
                          icon={<Key className="h-5 w-5 text-gray-400" />}
                          type="password"
                          fullWidth
                        />
                        
                        <Input
                          label="Modelo"
                          value={localSettings.aiProvider.model}
                          onChange={(e) => handleAIProviderFieldChange('model', e.target.value)}
                          icon={<Cpu className="h-5 w-5 text-gray-400" />}
                          fullWidth
                        />
                        
                        {localSettings.aiProvider.name === 'AzureOpenAI' && (
                          <>
                            <Input
                              label="Endpoint"
                              value={localSettings.aiProvider.endpoint || ''}
                              onChange={(e) => handleAIProviderFieldChange('endpoint', e.target.value)}
                              icon={<Globe className="h-5 w-5 text-gray-400" />}
                              placeholder="https://your-resource-name.openai.azure.com"
                              fullWidth
                            />
                            
                            <Input
                              label="Version API"
                              value={localSettings.aiProvider.version || ''}
                              onChange={(e) => handleAIProviderFieldChange('version', e.target.value)}
                              icon={<FileText className="h-5 w-5 text-gray-400" />}
                              placeholder="2023-05-15"
                              fullWidth
                            />
                          </>
                        )}
                        
                        {localSettings.aiProvider.name === 'MistralAI' && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            <p>
                              Para usar Mistral AI, necesitas una API key. Puedes obtener una en 
                              <a href="https://console.mistral.ai" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-800"> console.mistral.ai</a>
                            </p>
                            <p className="mt-2">
                              Modelo recomendado: <code>mistral-large-latest</code>
                            </p>
                          </div>
                        )}
                        
                        {localSettings.aiProvider.name === 'OpenAI' && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            <p>
                              Para usar OpenAI, necesitas una API key. Puedes obtener una en 
                              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-800"> platform.openai.com/api-keys</a>
                            </p>
                            <p className="mt-2">
                              Modelo recomendado: <code>gpt-4-vision-preview</code> o <code>gpt-4o</code>
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Test the API connection
                              alert('Esta funcionalidad será implementada próximamente');
                            }}
                          >
                            Probar Conexión
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Users and Groups */}
            {activeTab === 'users' && (
              <>
                <Card className="border border-gray-200">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Grupos de Usuarios</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<UserPlus className="h-4 w-4" />}
                      >
                        Nuevo Grupo
                      </Button>
                    </div>
                    
                    <div className="overflow-hidden rounded-md border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Descripción
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Miembros
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permisos
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userGroups.map((group) => (
                            <tr key={group.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{group.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-600">{group.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium">{group.memberCount}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{group.permissions.length} permisos</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
                
                <Card className="border border-gray-200">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Usuarios Activos</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<UserPlus className="h-4 w-4" />}
                      >
                        Nuevo Usuario
                      </Button>
                    </div>
                    
                    <div className="overflow-hidden rounded-md border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rol
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Grupo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Último Acceso
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => {
                            const userGroup = userGroups.find(g => g.id === user.userGroupId);
                            
                            return (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                                      <img className="h-10 w-10 object-cover" src={user.avatar} alt={user.name} />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                      <div className="text-sm text-gray-500">{user.department}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-600">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                                      user.role === 'technician' ? 'bg-green-100 text-green-800' : 
                                      'bg-gray-100 text-gray-800'}`}>
                                    {user.role === 'admin' && 'Administrador'}
                                    {user.role === 'manager' && 'Supervisor'}
                                    {user.role === 'technician' && 'Técnico'}
                                    {user.role === 'viewer' && 'Visualizador'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {userGroup?.name || 'Sin grupo'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {new Date(user.lastLogin).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </>
            )}
            
            {/* Authentication Settings */}
            {activeTab === 'auth' && (
              <Card className="border border-gray-200">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Configuración de Autenticación</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-3">Método de Autenticación</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Selecciona el proveedor de autenticación para los usuarios del sistema.
                      </p>
                      
                      <div className="space-y-2">
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.authProvider === 'azure' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setLocalSettings({ ...localSettings, authProvider: 'azure' })}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.authProvider === 'azure' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <Lock className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">Azure Active Directory</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Utiliza Microsoft Azure AD para autenticar a los usuarios. Ofrece autenticación única (SSO) e integración con Microsoft 365.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer ${localSettings.authProvider === 'local' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setLocalSettings({ ...localSettings, authProvider: 'local' })}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${localSettings.authProvider === 'local' ? 'bg-red-500' : 'border border-gray-400'}`}></div>
                            <div>
                              <div className="flex items-center">
                                <Lock className="h-5 w-5 text-gray-700 mr-2" />
                                <h4 className="font-medium">Autenticación Local</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Utiliza autenticación basada en usuario y contraseña almacenada localmente.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {localSettings.authProvider === 'azure' && (
                      <div>
                        <h3 className="text-md font-medium mb-3">Configuración de Azure AD</h3>
                        
                        <div className="space-y-4 p-4 border rounded-lg">
                          <Input
                            label="ID del Inquilino (Tenant ID)"
                            value={localSettings.azureSettings.tenantId}
                            onChange={(e) => setLocalSettings({
                              ...localSettings,
                              azureSettings: { ...localSettings.azureSettings, tenantId: e.target.value }
                            })}
                            fullWidth
                          />
                          
                          <Input
                            label="ID del Cliente (Client ID)"
                            value={localSettings.azureSettings.clientId}
                            onChange={(e) => setLocalSettings({
                              ...localSettings,
                              azureSettings: { ...localSettings.azureSettings, clientId: e.target.value }
                            })}
                            fullWidth
                          />
                          
                          <Input
                            label="URI de Redirección"
                            value={localSettings.azureSettings.redirectUri}
                            onChange={(e) => setLocalSettings({
                              ...localSettings,
                              azureSettings: { ...localSettings.azureSettings, redirectUri: e.target.value }
                            })}
                            fullWidth
                          />
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="useGraphApi"
                              checked={localSettings.azureSettings.useGraphApi}
                              onChange={(e) => setLocalSettings({
                                ...localSettings,
                                azureSettings: { ...localSettings.azureSettings, useGraphApi: e.target.checked }
                              })}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor="useGraphApi" className="ml-2 block text-sm text-gray-900">
                              Usar Microsoft Graph API para sincronizar información de usuarios
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {/* Automations Settings */}
            {activeTab === 'automations' && (
              <Card className="border border-gray-200">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Automatizaciones</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-3">Notificaciones y Alertas</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Configura las notificaciones automáticas y alertas del sistema.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                              <p className="font-medium">Alertas por Email</p>
                              <p className="text-sm text-gray-600">Enviar notificaciones por email cuando se creen o actualicen incidencias</p>
                            </div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input 
                              type="checkbox" 
                              id="emailAlerts"
                              checked={localSettings.automations.emailAlerts}
                              onChange={(e) => setLocalSettings({
                                ...localSettings,
                                automations: { ...localSettings.automations, emailAlerts: e.target.checked }
                              })}
                              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label 
                              htmlFor="emailAlerts" 
                              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                                localSettings.automations.emailAlerts ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                            ></label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                              <p className="font-medium">Informes Diarios</p>
                              <p className="text-sm text-gray-600">Generar y enviar informes diarios de actividad del sistema</p>
                            </div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input 
                              type="checkbox" 
                              id="dailyReports"
                              checked={localSettings.automations.dailyReports}
                              onChange={(e) => setLocalSettings({
                                ...localSettings,
                                automations: { ...localSettings.automations, dailyReports: e.target.checked }
                              })}
                              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label 
                              htmlFor="dailyReports" 
                              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                                localSettings.automations.dailyReports ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                            ></label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center">
                            <Bell className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                              <p className="font-medium">Notificaciones de Incidencias</p>
                              <p className="text-sm text-gray-600">Enviar notificaciones a responsables cuando se registren incidencias</p>
                            </div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input 
                              type="checkbox" 
                              id="incidentNotifications"
                              checked={localSettings.automations.incidentNotifications}
                              onChange={(e) => setLocalSettings({
                                ...localSettings,
                                automations: { ...localSettings.automations, incidentNotifications: e.target.checked }
                              })}
                              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label 
                              htmlFor="incidentNotifications" 
                              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                                localSettings.automations.incidentNotifications ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                            ></label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Backend Settings */}
            {activeTab === 'backend' && (
              <Card className="border border-gray-200">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Configuración del Backend</h2>
                  
                  <div className="space-y-6">
                    {/* Demo Mode Switch */}
                    <div>
                      <h3 className="text-md font-medium mb-3">Modo Demo</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Cuando está activado, la aplicación utilizará datos de demostración en lugar de conectarse a los servidores reales.
                      </p>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <ToggleLeft className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="font-medium">Usar Datos de Demostración</p>
                            <p className="text-sm text-gray-600">Los datos se generan localmente sin necesidad de conectar a bases de datos externas</p>
                          </div>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="demoMode"
                            checked={localSettings.demoMode}
                            onChange={(e) => setLocalSettings({
                              ...localSettings,
                              demoMode: e.target.checked
                            })}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                          />
                          <label 
                            htmlFor="demoMode" 
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                              localSettings.demoMode ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                          ></label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Debug Mode Switch */}
                    <div>
                      <h3 className="text-md font-medium mb-3">Modo Debug</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Cuando está activado, se mostrarán los detalles de las interacciones entre el frontend y el backend en la consola.
                      </p>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <Bug className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="font-medium">Mostrar Interacciones Frontend-Backend</p>
                            <p className="text-sm text-gray-600">Muestra logs detallados de las peticiones al backend en la consola del navegador</p>
                          </div>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="debugMode"
                            checked={localSettings.debugMode}
                            onChange={(e) => setLocalSettings({
                              ...localSettings,
                              debugMode: e.target.checked
                            })}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                          />
                          <label 
                            htmlFor="debugMode" 
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                              localSettings.debugMode ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                          ></label>
                        </div>
                      </div>
                    </div>

                    {/* Backend Connection */}
                    <div>
                      <h3 className="text-md font-medium mb-3">Conexión al Backend</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Configuración de la conexión al servidor backend.
                      </p>
                      
                      {/* Backend Status indicator */}
                      <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className={`h-3 w-3 rounded-full mr-2 ${Math.random() > 0.5 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm font-medium">{Math.random() > 0.5 ? 'Conectado' : 'Desconectado'} al backend</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.random() > 0.5 
                            ? 'El servidor está funcionando correctamente.' 
                            : 'No se pudo establecer conexión con el servidor.'}
                        </p>
                      </div>

                      <Input
                        label="Puerto del Backend"
                        type="number"
                        value="3002"
                        placeholder="3002"
                        fullWidth
                        className="mb-4"
                      />
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-1/2"
                        >
                          Reiniciar Backend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-1/2"
                        >
                          Ver Logs
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={handleReset}
              >
                Restablecer Predeterminados
              </Button>
              
              <Button
                variant="primary"
                icon={<Save className="h-4 w-4" />}
                onClick={handleSave}
              >
                {saved ? 'Guardado!' : 'Guardar Ajustes'}
              </Button>
            </div>
            
            {saved && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 text-sm text-center">
                Los ajustes se han guardado correctamente.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Custom styles for toggle switches */}
      <style>
        {`
          .toggle-checkbox:checked {
            right: 0;
            border-color: #fff;
          }
          .toggle-checkbox:checked + .toggle-label {
            background-color: #ef4444;
          }
          .toggle-label {
            transition: background-color 0.2s ease;
          }
          .toggle-checkbox {
            transition: all 0.2s ease;
            right: 4px;
          }
        `}
      </style>
    </div>
  );
};

export default SettingsPage;