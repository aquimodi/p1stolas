import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, RotateCcw, CheckCircle, XCircle, AlertTriangle, 
  Clock, Info, Database, Code, Cpu, Link, FileText, RefreshCw, 
  Globe, Server, Shield, Network
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useTestStore } from '../store/testStore';
import { TestItem, TestLog, TestStatus } from '../types';
import { apiService } from '../services/apiService';
import { useApiStatus } from '../hooks/useApiStatus';

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    tests, 
    runningTests,
    runTest, 
    runAllTests, 
    resetAllTests,
    clearLogs
  } = useTestStore();
  
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'frontend' | 'backend' | 'database' | 'integration' | 'ocr'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Use the API status hook
  const { status: apiStatus, error: apiError, checkNow: checkApiNow } = useApiStatus();
  
  useEffect(() => {
    if (autoScroll && logsEndRef.current && selectedTest) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTest, autoScroll]);
  
  const handleRunTest = (test: TestItem) => {
    setSelectedTest(test);
    runTest(test.id);
  };
  
  const handleRunAllTests = () => {
    setSelectedTest(null);
    runAllTests();
  };
  
  const handleResetTests = () => {
    setSelectedTest(null);
    resetAllTests();
  };
  
  const handleClearLogs = (testId: string) => {
    clearLogs(testId);
  };
  
  const isRunning = runningTests.length > 0;
  const runningCount = runningTests.length;
  const totalTests = tests.length;
  const successCount = tests.filter(t => t.status === 'success').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;
  
  const filteredTests = filter === 'all' 
    ? tests 
    : tests.filter(t => t.category === filter);

  const testFullDiagnostics = async () => {
    try {
      console.log('🔍 Running full diagnostics...');
      const result = await apiService.testConnection();
      
      if (result.success) {
        setConnectionDetails(result.data);
        alert(`✅ Diagnóstico completo exitoso!\n\nEstado: ${result.data.database?.connection || 'N/A'}\nErrores: ${result.data.errors?.length || 0}`);
      } else {
        alert(`❌ Error en el diagnóstico: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  const testBackendConnection = async () => {
    try {
      // Test connection to backend
      const result = await apiService.healthCheck();
      
      if (result.success) {
        alert(`✅ Conexión exitosa al backend!\n\n${JSON.stringify(result.data, null, 2)}`);
      } else {
        alert(`❌ Error al conectar con el backend:\n\n${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error al intentar conectar con el backend:\n\n${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mr-4"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/settings')}
        >
          Volver a Ajustes
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pruebas del Sistema</h1>
          <p className="text-gray-600">Verificación de componentes y funcionamiento</p>
        </div>
      </div>
      
      {/* Enhanced Connection Diagnostics */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Network className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <h2 className="text-lg font-semibold">Diagnóstico de Conectividad Frontend-Backend</h2>
                <p className="text-sm text-gray-600">
                  Comprueba la conexión completa entre el frontend y el backend API
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md">
                <span className="text-sm font-medium mr-2">Estado API:</span>
                {apiStatus === 'checking' && (
                  <span className="flex items-center text-yellow-600">
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Comprobando...
                  </span>
                )}
                {apiStatus === 'connected' && (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Conectado
                  </span>
                )}
                {apiStatus === 'failed' && (
                  <span className="flex items-center text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    Sin conexión
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={checkApiNow}
            >
              Health Check
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              icon={<Database className="h-4 w-4" />}
              onClick={testBackendConnection}
            >
              Test Backend
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              icon={<Shield className="h-4 w-4" />}
              onClick={testFullDiagnostics}
            >
              Diagnóstico Completo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              icon={<Globe className="h-4 w-4" />}
              onClick={() => window.open('/api/diagnostics/full', '_blank')}
            >
              Ver JSON Raw
            </Button>
          </div>
          
          {/* Configuration Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="font-semibold flex items-center mb-2 text-blue-800">
                <Info className="h-4 w-4 mr-1" />
                Configuración Frontend
              </div>
              <div className="space-y-1 text-blue-700">
                <div>API URL: {import.meta.env.VITE_API_URL || '/api'}</div>
                <div>Debug Mode: {import.meta.env.VITE_DEBUG_MODE || 'false'}</div>
                <div>Demo Mode: {import.meta.env.VITE_DEMO_MODE || 'false'}</div>
                <div>Environment: {import.meta.env.MODE}</div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md border border-green-200">
              <div className="font-semibold flex items-center mb-2 text-green-800">
                <Server className="h-4 w-4 mr-1" />
                Estado de Conexión
              </div>
              <div className="space-y-1 text-green-700">
                <div>Status: {apiStatus}</div>
                <div>Target: http://localhost:3002/api</div>
                <div>Proxy: Vite Dev Server</div>
                <div>CORS: Habilitado</div>
              </div>
            </div>
          </div>
          
          {/* Error Display */}
          {apiStatus === 'failed' && apiError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
              <div className="font-semibold flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Error de conexión:
              </div>
              <div className="ml-5 font-mono bg-red-100 p-2 rounded border">{apiError}</div>
              <div className="mt-3 text-xs">
                <strong>Posibles soluciones:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>Verifica que el servidor backend esté ejecutándose en el puerto 3002</li>
                  <li>Comprueba que no haya errores en los logs del servidor</li>
                  <li>Revisa la configuración de CORS en el backend</li>
                  <li>Asegúrate de que las variables de entorno estén configuradas correctamente</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Connection Details */}
          {connectionDetails && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm">
              <div className="font-semibold flex items-center mb-2">
                <Database className="h-4 w-4 mr-1" />
                Detalles del diagnóstico completo:
              </div>
              <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                {JSON.stringify(connectionDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex space-x-2">
            <Button
              variant={isRunning ? 'outline' : 'primary'}
              icon={<Play className="h-4 w-4" />}
              onClick={handleRunAllTests}
              disabled={isRunning}
            >
              Ejecutar Todas
            </Button>
            <Button
              variant="outline"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={handleResetTests}
              disabled={isRunning}
            >
              Reiniciar
            </Button>
          </div>
          
          <div className="flex space-x-6">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-100 p-1.5 mr-2">
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">En ejecución</div>
                <div className="font-semibold">{runningCount}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-1.5 mr-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Exitosas</div>
                <div className="font-semibold">{successCount}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 p-1.5 mr-2">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Fallidas</div>
                <div className="font-semibold">{failedCount}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-1.5 mr-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Advertencias</div>
                <div className="font-semibold">{warningCount}</div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">Todos los tests</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="database">Base de Datos</option>
              <option value="integration">Integración</option>
              <option value="ocr">OCR</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Pruebas</h2>
          
          {filteredTests.map(test => (
            <TestListItem 
              key={test.id} 
              test={test} 
              isRunning={runningTests.includes(test.id)} 
              isSelected={selectedTest?.id === test.id}
              onRun={() => handleRunTest(test)}
              onSelect={() => setSelectedTest(test)}
              onClearLogs={() => handleClearLogs(test.id)}
            />
          ))}
          
          {filteredTests.length === 0 && (
            <div className="bg-gray-50 text-gray-500 p-4 rounded-lg text-center">
              No hay pruebas para la categoría seleccionada
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Registro de Ejecución</h2>
            <div className="flex items-center">
              <input
                id="autoscroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="autoscroll" className="ml-2 text-sm text-gray-700">
                Auto-scroll
              </label>
            </div>
          </div>
          
          <Card className="border border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center">
                {selectedTest ? (
                  <>
                    <StatusIcon status={selectedTest.status} className="mr-2" />
                    <span className="font-medium">{selectedTest.name}</span>
                    <span className="ml-2 text-sm text-gray-500">{selectedTest.description}</span>
                  </>
                ) : (
                  <span className="font-medium">Selecciona una prueba para ver detalles</span>
                )}
              </div>
            </div>
            
            <div className="p-0">
              <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm bg-gray-900 text-gray-300">
                {selectedTest ? (
                  selectedTest.logs.length > 0 ? (
                    <>
                      {selectedTest.logs.map(log => (
                        <LogEntry key={log.id} log={log} />
                      ))}
                      <div ref={logsEndRef} />
                    </>
                  ) : (
                    <div className="text-gray-500 italic">
                      No hay registros para esta prueba. Ejecuta la prueba para ver los resultados.
                    </div>
                  )
                ) : (
                  <div className="text-gray-500 italic">
                    Selecciona una prueba para ver sus registros o ejecuta "Ejecutar Todas" para ver resultados de todas las pruebas.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface TestListItemProps {
  test: TestItem;
  isRunning: boolean;
  isSelected: boolean;
  onRun: () => void;
  onSelect: () => void;
  onClearLogs: () => void;
}

const TestListItem: React.FC<TestListItemProps> = ({ 
  test, 
  isRunning, 
  isSelected,
  onRun,
  onSelect,
  onClearLogs
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frontend':
        return <Code className="h-5 w-5 text-blue-500" />;
      case 'backend':
        return <Server className="h-5 w-5 text-purple-500" />;
      case 'database':
        return <Database className="h-5 w-5 text-green-500" />;
      case 'integration':
        return <Link className="h-5 w-5 text-orange-500" />;
      case 'ocr':
        return <FileText className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <Card 
      className={`border hover:border-red-200 cursor-pointer transition-colors ${
        isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200'
      }`}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              {getCategoryIcon(test.category)}
            </div>
            <div>
              <h3 className="font-medium">{test.name}</h3>
              <p className="text-sm text-gray-600">{test.description}</p>
              {test.duration !== undefined && (
                <p className="text-xs text-gray-500 mt-1">Duración: {test.duration}ms</p>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <StatusIcon status={test.status} className="mr-2" />
            <Button
              size="sm"
              variant={isRunning ? "secondary" : "primary"}
              disabled={isRunning}
              onClick={(e) => {
                e.stopPropagation();
                onRun();
              }}
              icon={isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            >
              {isRunning ? 'Ejecutando...' : 'Ejecutar'}
            </Button>
            
            {test.logs.length > 0 && (
              <button
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearLogs();
                }}
                title="Limpiar logs"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                test.status === 'success' ? 'bg-green-500' : 
                test.status === 'failed' ? 'bg-red-500' : 
                test.status === 'warning' ? 'bg-yellow-500' : 
                'bg-blue-500'
              }`}
              style={{ width: `${test.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface StatusIconProps {
  status: TestStatus;
  className?: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status, className }) => {
  switch (status) {
    case 'success':
      return <CheckCircle className={`h-5 w-5 text-green-500 ${className}`} />;
    case 'failed':
      return <XCircle className={`h-5 w-5 text-red-500 ${className}`} />;
    case 'warning':
      return <AlertTriangle className={`h-5 w-5 text-yellow-500 ${className}`} />;
    case 'running':
      return <RefreshCw className={`h-5 w-5 text-blue-500 animate-spin ${className}`} />;
    case 'idle':
    default:
      return <Clock className={`h-5 w-5 text-gray-400 ${className}`} />;
  }
};

interface LogEntryProps {
  log: TestLog;
}

const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  // Format timestamp to only show hours, minutes, seconds and milliseconds
  const formattedTime = new Date(log.timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Add milliseconds
  const ms = new Date(log.timestamp).getMilliseconds().toString().padStart(3, '0');
  
  const getLogColor = () => {
    switch (log.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
      default:
        return 'text-blue-400';
    }
  };
  
  return (
    <div className="mb-1">
      <span className="text-gray-500">[{formattedTime}.{ms}] </span>
      <span className={getLogColor()}>
        {log.type.toUpperCase()}: 
      </span>
      <span className="ml-2">{log.message}</span>
    </div>
  );
};

export default TestPage;