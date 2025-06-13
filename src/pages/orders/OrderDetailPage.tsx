import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Package, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import DeliveryNoteCard from '../../components/deliveryNote/DeliveryNoteCard';
import DeliveryNoteForm from '../../components/deliveryNote/DeliveryNoteForm';
import IncidentsList from '../../components/incident/IncidentsList';
import { useAppStore } from '../../store';
import { fileToBase64 } from '../../services/fileService';
import { analyzeDocumentWithAI } from '../../services/aiService';
import { analyzeDocumentWithScribe } from '../../services/ocrService';
import { getMistralAIPrompt, getIncidentsByOrderId } from '../../utils/helpers';
import { useSettingsStore } from '../../store/settingsStore';

const OrderDetailPage: React.FC = () => {
  const { projectId, orderId } = useParams<{ projectId: string; orderId: string }>();
  const navigate = useNavigate();
  const { 
    getProjectById, 
    getOrderById, 
    addDeliveryNote, 
    addEquipment, 
    generateDeviceName,
    incidents
  } = useAppStore();
  const { settings } = useSettingsStore();
  
  const [project, setProject] = useState(getProjectById(projectId || ''));
  const [order, setOrder] = useState(getOrderById(orderId || ''));
  const [isAddingDeliveryNote, setIsAddingDeliveryNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  
  useEffect(() => {
    if (!project || !order) {
      // Project or order not found, redirect to projects page
      navigate('/projects');
    }
  }, [project, order, navigate]);
  
  useEffect(() => {
    // Refresh data when it changes or when refreshKey changes
    setProject(getProjectById(projectId || ''));
    setOrder(getOrderById(orderId || ''));
    
    // Get related incidents for this order
    if (order) {
      setRelatedIncidents(getIncidentsByOrderId(incidents, order));
    }
  }, [projectId, orderId, getProjectById, getOrderById, incidents, order, refreshKey]);
  
  if (!project || !order) return null;
  
  const handleAddDeliveryNote = async (data: any, file: File | null) => {
    setIsSubmitting(true);
    
    try {
      // First, add the delivery note
      const attachmentType = file?.type.includes('pdf')
        ? 'pdf'
        : file?.type.includes('excel') || file?.type.includes('spreadsheet')
          ? 'excel'
          : file?.type.includes('image')
            ? 'image'
            : 'doc';
      
      const noteData = {
        ...data,
        attachmentPath: file ? file.name : '',
        attachmentType: file ? attachmentType : 'doc'
      };
      
      addDeliveryNote(order.id, noteData);
      
      // Get the new delivery note ID
      const updatedOrder = getOrderById(order.id);
      const newNote = updatedOrder?.deliveryNotes[updatedOrder.deliveryNotes.length - 1];
      
      if (newNote && file) {
        // Only analyze if file is present
        const fileBase64 = await fileToBase64(file);
        
        let equipments = [];
        
        // Use the OCR method from settings
        if (settings.ocrMethod === 'ai') {
          // Use AI for OCR
          const prompt = getMistralAIPrompt();
          equipments = await analyzeDocumentWithAI(fileBase64, file.type, prompt);
        } else {
          // Use Scribe.js for OCR (pure JavaScript)
          equipments = await analyzeDocumentWithScribe(fileBase64, file.type);
        }
        
        // Add the extracted equipment to the delivery note
        for (const equipment of equipments) {
          // Generate a device name for each equipment
          const deviceName = generateDeviceName(project.datacenter);
          
          addEquipment(newNote.id, {
            ...equipment,
            deviceName
          });
        }
      }
      
      setIsAddingDeliveryNote(false);
      // Refresh the order data after adding delivery note
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error adding delivery note:', error);
      alert('Error al añadir el albarán. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
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
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pedido: {order.code}
          </h1>
          <p className="text-gray-600">
            Proyecto: {project.projectName}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 border border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Información del Pedido</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Código:</span>
                <span className="text-gray-600">{order.code}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Package className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Equipos Estimados:</span>
                <span className="text-gray-600">{order.estimatedEquipment}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-1">Método de OCR:</span>
                <span className="text-gray-600">
                  {settings.ocrMethod === 'ai' 
                    ? `IA (${settings.aiProvider.name})` 
                    : 'OCR JavaScript (Scribe.js)'}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progreso</span>
                <span className="text-sm font-medium">{order.progress}%</span>
              </div>
              <ProgressBar value={order.progress} showPercentage={false} size="lg" />
            </div>
          </div>
        </Card>
        
        <Card className="border border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Resumen</h2>
            
            <div className="divide-y divide-gray-200">
              <div className="py-2 flex justify-between">
                <span className="text-gray-600">Albaranes</span>
                <span className="font-semibold">{order.deliveryNotes.length}</span>
              </div>
              
              <div className="py-2 flex justify-between">
                <span className="text-gray-600">Equipos en Albaranes</span>
                <span className="font-semibold">
                  {order.deliveryNotes.reduce((total, note) => total + note.deliveredEquipment, 0)}
                </span>
              </div>
              
              <div className="py-2 flex justify-between">
                <span className="text-gray-600">Equipos Verificados</span>
                <span className="font-semibold">
                  {order.deliveryNotes.reduce((total, note) => total + note.verifiedEquipment, 0)}
                </span>
              </div>
              
              <div className="py-2 flex justify-between">
                <span className="text-gray-600">Incidencias</span>
                <span className="font-semibold">
                  {relatedIncidents.length}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Albaranes</h2>
          <Button
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setIsAddingDeliveryNote(true)}
          >
            Añadir Albarán
          </Button>
        </div>
        
        {order.deliveryNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-4">No hay albaranes creados para este pedido.</p>
            <Button onClick={() => setIsAddingDeliveryNote(true)}>Añadir un Albarán</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {order.deliveryNotes.map((deliveryNote) => (
              <DeliveryNoteCard 
                key={deliveryNote.id} 
                deliveryNote={deliveryNote} 
                projectId={project.id}
                orderId={order.id}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Incidents section */}
      <div className="mb-6">
        <IncidentsList 
          incidents={relatedIncidents}
          title="Incidencias relacionadas con este pedido"
          emptyMessage="No hay incidencias registradas para este pedido"
        />
      </div>
      
      {/* Add Delivery Note Modal */}
      <Modal
        isOpen={isAddingDeliveryNote}
        onClose={() => setIsAddingDeliveryNote(false)}
        title="Añadir Albarán"
      >
        <DeliveryNoteForm 
          onSubmit={handleAddDeliveryNote}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default OrderDetailPage;