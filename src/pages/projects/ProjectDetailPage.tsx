import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Building, FileText, Calendar, Upload, Download, Cpu } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import OrderCard from '../../components/order/OrderCard';
import OrderForm from '../../components/order/OrderForm';
import IncidentsList from '../../components/incident/IncidentsList';
import { useAppStore } from '../../store';
import { formatDate, exportExcelFile, getIncidentsByProjectId } from '../../utils/helpers';
import { useSettingsStore } from '../../store/settingsStore';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { 
    getProjectById, 
    addOrder, 
    updateProject, 
    incidents
  } = useAppStore();
  const { settings } = useSettingsStore();
  
  const [project, setProject] = useState(getProjectById(projectId || ''));
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [isExcelUpdated, setIsExcelUpdated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for forcing re-renders
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  
  useEffect(() => {
    if (!project) {
      // Project not found, redirect to projects page
      navigate('/projects');
    }
    
    // Set random Excel update notification
    const randomShowExcelUpdate = Math.random() > 0.7;
    if (randomShowExcelUpdate) {
      setTimeout(() => {
        setIsExcelUpdated(true);
      }, 3000);
    }
  }, [project, navigate]);
  
  useEffect(() => {
    // Refresh data when it changes or when refreshKey changes
    setProject(getProjectById(projectId || ''));
    
    // Get related incidents for this project
    if (project) {
      setRelatedIncidents(getIncidentsByProjectId(incidents, project));
    }
  }, [projectId, getProjectById, incidents, project, refreshKey]);
  
  if (!project) return null;
  
  const handleAddOrder = (orderData: any) => {
    addOrder(project.id, orderData);
    // Increment refresh key to trigger project refresh
    setRefreshKey(prev => prev + 1);
    setIsAddingOrder(false);
  };
  
  const handleExcelDownload = () => {
    // Mock implementation for downloading the Excel file
    const mockProjectData = {
      projectCode: project.projectCode,
      projectName: project.projectName,
      client: project.client,
      datacenter: project.datacenter,
      ritmCode: project.ritmCode,
      deliveryDate: project.deliveryDate,
      status: project.status,
      progress: project.progress,
      createdAt: project.createdAt
    };
    
    const mockEquipmentList = (project.estimatedEquipmentList || []).map(item => ({
      Type: item.type,
      Model: item.model,
      Quantity: item.quantity,
      Assigned: item.assignedEquipmentCount
    }));
    
    exportExcelFile(mockProjectData, mockEquipmentList);
  };
  
  // Get AI provider name for display
  const getAIProviderDisplay = () => {
    if (settings.ocrMethod === 'ai') {
      return `IA (${settings.aiProvider.name})`;
    } else {
      return 'OCR JavaScript (Scribe.js)';
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
          onClick={() => navigate('/projects')}
        >
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 truncate">
          {project.projectName}
        </h1>
        <div className="ml-4">
          <StatusBadge status={project.status} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 h-full">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Información del Proyecto</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">Código:</span>
                  <span className="text-gray-600">{project.projectCode}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">RITM:</span>
                  <span className="text-gray-600">{project.ritmCode}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">Cliente:</span>
                  <span className="text-gray-600">{project.client}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">Datacenter:</span>
                  <span className="text-gray-600">{project.datacenter}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">Fecha de Entrega:</span>
                  <span className="text-gray-600">{formatDate(project.deliveryDate)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">Fecha de Creación:</span>
                  <span className="text-gray-600">{formatDate(project.createdAt)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Cpu className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">Método de OCR:</span>
                  <span className="text-gray-600">
                    {getAIProviderDisplay()}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Progreso General</span>
                  <span className="text-sm font-medium">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} showPercentage={false} size="lg" />
              </div>
              
              <div className="flex flex-wrap gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleExcelDownload}
                >
                  Descargar Excel
                </Button>
                
                <a href={project.teamsUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Carpeta Teams
                  </Button>
                </a>
                
                {project.progress === 100 && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Enviar al DCIM
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <Card className="border border-gray-200">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Equipamiento Estimado</h2>
              
              {project.estimatedEquipmentList?.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {project.estimatedEquipmentList.map((equipment, idx) => (
                    <div key={idx} className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{equipment.type} - {equipment.model}</p>
                          <p className="text-sm text-gray-500">
                            {equipment.assignedEquipmentCount} de {equipment.quantity} asignados
                          </p>
                        </div>
                        <div className="text-2xl font-semibold text-gray-700">
                          {equipment.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay equipamiento estimado definido</p>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pedidos</h2>
          <Button
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setIsAddingOrder(true)}
          >
            Añadir Pedido
          </Button>
        </div>
        
        {project.orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-4">No hay pedidos creados para este proyecto.</p>
            <Button onClick={() => setIsAddingOrder(true)}>Crear un Pedido</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.orders.map((order) => (
              <OrderCard key={order.id} order={order} projectId={project.id} />
            ))}
          </div>
        )}
      </div>
      
      {/* Incidents section */}
      <div className="mb-6">
        <IncidentsList 
          incidents={relatedIncidents}
          title="Incidencias relacionadas con este proyecto"
          emptyMessage="No hay incidencias registradas para este proyecto"
        />
      </div>
      
      {/* Add Order Modal */}
      <Modal
        isOpen={isAddingOrder}
        onClose={() => setIsAddingOrder(false)}
        title="Añadir Pedido"
      >
        <OrderForm onSubmit={handleAddOrder} />
      </Modal>
      
      {/* Excel Updated Notification */}
      <Modal
        isOpen={isExcelUpdated}
        onClose={() => setIsExcelUpdated(false)}
        title="Excel Actualizado"
        size="sm"
      >
        <div className="text-center p-4">
          <p className="text-lg mb-4">
            El archivo <span className="font-semibold">{project.excelPath}</span> ha sido actualizado en la carpeta de Teams.
          </p>
          <div className="mb-4">
            <a 
              href={project.teamsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 underline"
            >
              Abrir carpeta Teams para ver el archivo
            </a>
          </div>
          <Button
            onClick={() => setIsExcelUpdated(false)}
          >
            Entendido
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;