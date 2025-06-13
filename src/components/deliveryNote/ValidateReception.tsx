import React, { useState, useRef } from 'react';
import { Camera, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { Equipment } from '../../types';
import { createImageFromCamera } from '../../services/fileService';

interface ValidateReceptionProps {
  equipments: Equipment[];
  onVerifyEquipment: (equipmentId: string, photoPath: string) => void;
  onCreateIncident: (equipmentId: string, description: string, photoPath: string) => void;
  isLoading?: boolean;
}

const ValidateReception: React.FC<ValidateReceptionProps> = ({
  equipments,
  onVerifyEquipment,
  onCreateIncident,
  isLoading = false
}) => {
  const [activeEquipment, setActiveEquipment] = useState<Equipment | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const unmatchedEquipments = equipments.filter(e => e.isMatched && !e.isVerified);
  
  const handleStartCapture = async (equipment: Equipment) => {
    setActiveEquipment(equipment);
    setIsCapturing(true);
    setCapturedImage(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara. Por favor, revisa los permisos.');
      setIsCapturing(false);
    }
  };
  
  const handleCapturePhoto = async () => {
    if (!streamRef.current || !videoRef.current || !activeEquipment) return;
    
    try {
      const imageData = await createImageFromCamera(streamRef.current);
      setCapturedImage(imageData);
      
      // Stop the stream
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCapturing(false);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Error al capturar la foto. Por favor, inténtalo de nuevo.');
    }
  };
  
  const handleVerifyEquipment = () => {
    if (!activeEquipment || !capturedImage) return;
    
    onVerifyEquipment(activeEquipment.id, capturedImage);
    setActiveEquipment(null);
    setCapturedImage(null);
  };
  
  const handleReportIssue = () => {
    if (!activeEquipment) return;
    
    setIsIncidentModalOpen(true);
  };
  
  const handleSubmitIncident = () => {
    if (!activeEquipment || !capturedImage || !incidentDescription) return;
    
    onCreateIncident(activeEquipment.id, incidentDescription, capturedImage);
    setIsIncidentModalOpen(false);
    setIncidentDescription('');
    setActiveEquipment(null);
    setCapturedImage(null);
  };
  
  const cancelCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsCapturing(false);
    setCapturedImage(null);
    setActiveEquipment(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Validar Recepción</h3>
        <div className="text-sm text-gray-600">
          {unmatchedEquipments.length} equipos pendientes de verificar
        </div>
      </div>
      
      {activeEquipment ? (
        <Card className="p-4">
          <h4 className="text-lg font-medium mb-4">{activeEquipment.name}</h4>
          
          {isCapturing ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ height: '70vh' }}>
                <video 
                  ref={videoRef} 
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={cancelCapture}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  size="lg"
                  icon={<Camera className="h-5 w-5" />}
                  onClick={handleCapturePhoto}
                >
                  Capturar
                </Button>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="space-y-4">
              <div className="bg-black rounded-lg overflow-hidden w-full" style={{ height: '70vh' }}>
                <img 
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={cancelCapture}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="danger" 
                  size="lg"
                  icon={<XCircle className="h-5 w-5" />}
                  onClick={handleReportIssue}
                >
                  Reportar Incidencia
                </Button>
                <Button 
                  variant="success" 
                  size="lg"
                  icon={<CheckCircle className="h-5 w-5" />}
                  onClick={handleVerifyEquipment}
                >
                  Confirmar Recepción
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <Camera className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-6">Presiona el botón para iniciar la cámara y tomar una foto</p>
              
              <Button 
                variant="primary" 
                size="lg"
                icon={<Camera className="h-5 w-5" />}
                onClick={() => handleStartCapture(activeEquipment)}
              >
                Iniciar Cámara
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unmatchedEquipments.length === 0 ? (
            <div className="col-span-2 p-8 bg-gray-50 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700">¡Todos los equipos han sido verificados!</p>
              <p className="text-gray-600 mt-2">Puedes proceder a la siguiente fase del proceso.</p>
            </div>
          ) : (
            unmatchedEquipments.map((equipment) => (
              <Card key={equipment.id} className="border border-gray-200">
                <div className="p-4">
                  <h5 className="font-medium text-lg mb-2">{equipment.name}</h5>
                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-gray-600">Tipo: {equipment.type}</p>
                    <p className="text-sm text-gray-600">Modelo: {equipment.model}</p>
                    <p className="text-sm text-gray-600">S/N: {equipment.serialNumber}</p>
                    <p className="text-sm text-gray-600">Device: {equipment.deviceName}</p>
                  </div>
                  
                  <Button
                    fullWidth
                    size="md"
                    icon={<Camera className="h-5 w-5" />}
                    onClick={() => handleStartCapture(equipment)}
                  >
                    Verificar Recepción
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
      
      {/* Incident Modal */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        title="Reportar Incidencia"
        footer={
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="mr-2"
              onClick={() => setIsIncidentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={<AlertTriangle className="h-4 w-4" />}
              onClick={handleSubmitIncident}
              disabled={!incidentDescription}
            >
              Reportar Incidencia
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden mb-4" style={{ maxHeight: '200px' }}>
            {capturedImage && (
              <img 
                src={capturedImage}
                alt="Issue"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          
          <Input
            label="Descripción de la incidencia"
            value={incidentDescription}
            onChange={(e) => setIncidentDescription(e.target.value)}
            fullWidth
            as="textarea"
            rows={4}
          />
          
          <div className="text-sm text-gray-600">
            <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-600" />
            La incidencia será registrada y el equipo quedará pendiente de verificación.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ValidateReception;