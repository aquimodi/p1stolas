import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, File } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import ValidateDeliveryNote from '../../components/deliveryNote/ValidateDeliveryNote';
import ValidateReception from '../../components/deliveryNote/ValidateReception';
import SendToDCIM from '../../components/deliveryNote/SendToDCIM';
import IncidentsList from '../../components/incident/IncidentsList';
import { useAppStore } from '../../store';
import { getIncidentsByDeliveryNoteId } from '../../utils/helpers';

const DeliveryNoteDetailPage: React.FC = () => {
  const { projectId, orderId, deliveryNoteId } = useParams<{ 
    projectId: string; 
    orderId: string;
    deliveryNoteId: string;
  }>();
  
  const navigate = useNavigate();
  const { 
    getProjectById, 
    getOrderById, 
    getDeliveryNoteById,
    matchEquipment,
    unmatchEquipment,
    updateEquipment,
    verifyEquipment,
    addIncident,
    updateDeliveryNote,
    getEstimatedEquipmentByProjectId,
    incidents
  } = useAppStore();
  
  const [project, setProject] = useState(getProjectById(projectId || ''));
  const [order, setOrder] = useState(getOrderById(orderId || ''));
  const [deliveryNote, setDeliveryNote] = useState(getDeliveryNoteById(deliveryNoteId || ''));
  const [estimatedEquipment, setEstimatedEquipment] = useState(getEstimatedEquipmentByProjectId(projectId || ''));
  const [activeTab, setActiveTab] = useState<'validate' | 'reception' | 'dcim'>('validate');
  const [refreshKey, setRefreshKey] = useState(0);
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  
  useEffect(() => {
    if (!project || !order || !deliveryNote) {
      // Project, order or delivery note not found, redirect to projects page
      navigate('/projects');
    }
    
    // Determine active tab based on delivery note status
    if (deliveryNote) {
      const matchedCount = deliveryNote.equipments.filter(e => e.isMatched).length;
      const verifiedCount = deliveryNote.equipments.filter(e => e.isVerified).length;
      
      if (deliveryNote.equipments.length > 0 && matchedCount === deliveryNote.equipments.length) {
        if (verifiedCount === matchedCount) {
          setActiveTab('dcim');
        } else {
          setActiveTab('reception');
        }
      } else {
        setActiveTab('validate');
      }
    }
  }, [project, order, deliveryNote, navigate]);
  
  useEffect(() => {
    // Refresh data when it changes
    setProject(getProjectById(projectId || ''));
    setOrder(getOrderById(orderId || ''));
    setDeliveryNote(getDeliveryNoteById(deliveryNoteId || ''));
    setEstimatedEquipment(getEstimatedEquipmentByProjectId(projectId || ''));
    
    // Get related incidents
    if (deliveryNote) {
      setRelatedIncidents(getIncidentsByDeliveryNoteId(
        incidents, 
        deliveryNote.id,
        deliveryNote.equipments
      ));
    }
  }, [
    projectId, 
    orderId, 
    deliveryNoteId, 
    getProjectById, 
    getOrderById, 
    getDeliveryNoteById, 
    getEstimatedEquipmentByProjectId, 
    incidents,
    deliveryNote,
    refreshKey
  ]);
  
  if (!project || !order || !deliveryNote) return null;
  
  const handleMatchEquipment = (equipmentId: string, estimatedEquipmentId: string) => {
    matchEquipment(equipmentId, estimatedEquipmentId);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleUnmatchEquipment = (equipmentId: string) => {
    unmatchEquipment(equipmentId);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleUpdateEquipment = (equipmentId: string, data: any) => {
    updateEquipment(equipmentId, data);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleVerifyEquipment = (equipmentId: string, photoPath: string) => {
    verifyEquipment(equipmentId, photoPath);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleCreateIncident = (equipmentId: string, description: string, photoPath: string) => {
    addIncident({
      equipmentId,
      description,
      status: 'Pendiente',
      photoPath
    });
    setRefreshKey(prev => prev + 1);
  };
  
  const handleSendToDCIM = () => {
    updateDeliveryNote(deliveryNote.id, { status: 'Completado' });
    setRefreshKey(prev => prev + 1);
  };
  
  const handleAutomaticMatch = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Calculate if all equipment are verified
  const isAllVerified = deliveryNote.equipments.length > 0 && 
                        deliveryNote.equipments.filter(e => e.isVerified).length === deliveryNote.equipments.length;
  
  // Check if already sent to DCIM
  const isSentToDCIM = deliveryNote.status === 'Completado';
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mr-4"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate(`/projects/${projectId}/orders/${orderId}`)}
        >
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Albarán: {deliveryNote.code}
          </h1>
          <p className="text-gray-600">
            {project.projectName} &gt; Pedido: {order.code}
          </p>
        </div>
        <div className="ml-4">
          <StatusBadge status={deliveryNote.status} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 border border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Información del Albarán</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div className="flex items-center text-sm">
                <File className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Código:</span>
                <span className="text-gray-600">{deliveryNote.code}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <File className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Tipo de Adjunto:</span>
                <span className="text-gray-600 capitalize">{deliveryNote.attachmentType}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <File className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Equipos Estimados:</span>
                <span className="text-gray-600">{deliveryNote.estimatedEquipment}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <File className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Equipos Entregados:</span>
                <span className="text-gray-600">{deliveryNote.deliveredEquipment}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <File className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Equipos Verificados:</span>
                <span className="text-gray-600">{deliveryNote.verifiedEquipment}</span>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progreso</span>
                <span className="text-sm font-medium">{deliveryNote.progress}%</span>
              </div>
              <ProgressBar value={deliveryNote.progress} showPercentage={false} size="lg" />
            </div>
          </div>
        </Card>
        
        <Card className="border border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Estado de Validación</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Matcheo de Equipos</span>
                  <span className="text-sm">
                    {deliveryNote.equipments.filter(e => e.isMatched).length} / {deliveryNote.equipments.length}
                  </span>
                </div>
                <ProgressBar 
                  value={deliveryNote.equipments.filter(e => e.isMatched).length} 
                  max={deliveryNote.equipments.length}
                  showPercentage={false}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Validación de Recepción</span>
                  <span className="text-sm">
                    {deliveryNote.equipments.filter(e => e.isVerified).length} / {deliveryNote.equipments.length}
                  </span>
                </div>
                <ProgressBar 
                  value={deliveryNote.equipments.filter(e => e.isVerified).length} 
                  max={deliveryNote.equipments.length}
                  showPercentage={false}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Envío al DCIM</span>
                  <span className="text-sm">
                    {isSentToDCIM ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
                <ProgressBar 
                  value={isSentToDCIM ? 100 : 0} 
                  showPercentage={false}
                  color={isSentToDCIM ? 'green' : 'red'}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'validate'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('validate')}
            >
              Validar Albarán
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'reception'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('reception')}
              disabled={deliveryNote.equipments.length === 0 || deliveryNote.equipments.filter(e => e.isMatched).length !== deliveryNote.equipments.length}
            >
              Validar Recepción
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'dcim'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('dcim')}
              disabled={!isAllVerified}
            >
              Enviar al DCIM
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'validate' && (
            <ValidateDeliveryNote 
              equipments={deliveryNote.equipments}
              estimatedEquipments={estimatedEquipment}
              onMatch={handleMatchEquipment}
              onUnmatch={handleUnmatchEquipment}
              onUpdateEquipment={handleUpdateEquipment}
              onAutomaticMatch={handleAutomaticMatch}
            />
          )}
          
          {activeTab === 'reception' && (
            <ValidateReception 
              equipments={deliveryNote.equipments}
              onVerifyEquipment={handleVerifyEquipment}
              onCreateIncident={handleCreateIncident}
            />
          )}
          
          {activeTab === 'dcim' && (
            <SendToDCIM 
              project={project}
              onSendToDCIM={handleSendToDCIM}
              isAllVerified={isAllVerified}
              isSent={isSentToDCIM}
            />
          )}
        </div>
      </div>
      
      {/* Incidents section */}
      <div className="mb-8">
        <IncidentsList 
          incidents={relatedIncidents}
          title="Incidencias relacionadas con este albarán"
          emptyMessage="No hay incidencias registradas para este albarán"
        />
      </div>
    </div>
  );
};

export default DeliveryNoteDetailPage;