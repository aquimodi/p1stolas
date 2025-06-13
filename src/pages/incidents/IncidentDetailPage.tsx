import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Package, CheckCircle, XCircle, MessageSquare, Camera, Send, Image, PlusCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { formatDate } from '../../utils/helpers';
import { useAppStore } from '../../store';
import { createImageFromCamera } from '../../services/fileService';

const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { incidents, updateIncident, addIncidentComment } = useAppStore();
  
  // Get incident data
  const incident = incidents.find(inc => inc.id === incidentId);
  
  const [commentText, setCommentText] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // Clean up camera stream when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);
  
  if (!incident) {
    navigate('/incidents');
    return null;
  }
  
  const handleResolve = () => {
    if (resolutionNote.trim() === '') {
      alert('Por favor, ingresa una nota de resolución');
      return;
    }
    
    updateIncident(incident.id, { 
      status: 'Resuelto',
      resolution: {
        date: new Date().toISOString(),
        description: resolutionNote,
        technician: 'Usuario Actual'  // In a real app, get this from auth
      }
    });
    
    alert('Incidencia marcada como resuelta');
    setResolutionNote('');
  };

  const handleAddComment = () => {
    if (commentText.trim() === '') {
      alert('Por favor, ingresa un comentario');
      return;
    }
    
    addIncidentComment(incident.id, {
      text: commentText,
      author: 'Usuario Actual',  // In a real app, get this from auth
      photoPath: capturedImage
    });
    
    // Reset form
    setCommentText('');
    setCapturedImage(null);
    
    alert('Comentario añadido con éxito');
  };
  
  const handleStartCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    
    try {
      const constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      };
      
      // First, check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de cámara no soportada en este navegador');
      }
      
      // Get the list of available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No se detectó ninguna cámara en tu dispositivo');
      }
      
      // Try to access the camera
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          setCameraError('Error al iniciar la cámara: ' + error.message);
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Error al acceder a la cámara';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setCameraError(errorMessage);
      
      // Keep the modal open to show the error
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }, 100);
    }
  };
  
  const handleCapturePhoto = async () => {
    if (!streamRef.current || !videoRef.current) return;
    
    try {
      const imageData = await createImageFromCamera(streamRef.current);
      setCapturedImage(imageData);
      
      // Stop the stream
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraOpen(false);
    } catch (error) {
      console.error('Error capturing photo:', error);
      setCameraError('Error al capturar la foto. Por favor, inténtalo de nuevo.');
    }
  };
  
  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsCameraOpen(false);
    setCameraError(null);
  };
  
  // Mock data for equipment
  const mockEquipment = {
    name: 'Servidor PowerEdge R740',
    type: 'Servidor',
    model: 'Dell PowerEdge R740',
    serialNumber: 'SRV-2025-0012',
    project: 'Ampliación Datacenter Madrid',
    order: 'ORD-2025-042',
    deliveryNote: 'ALB-2025-078'
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mr-4"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/incidents')}
        >
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Incidencia #{incident.id.substring(3)}
          </h1>
        </div>
        <div className="ml-4">
          <StatusBadge status={incident.status} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 mb-6">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Información de la Incidencia</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="mt-1 text-gray-900">{incident.description}</p>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1 text-gray-500">Fecha de Creación:</span>
                  <span className="text-gray-900">{formatDate(incident.createdAt)}</span>
                </div>
                
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1 text-gray-500">Equipo Afectado:</span>
                  <span className="text-gray-900">{mockEquipment.name}</span>
                </div>
                
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1 text-gray-500">S/N:</span>
                  <span className="text-gray-900">{mockEquipment.serialNumber}</span>
                </div>
                
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1 text-gray-500">Proyecto:</span>
                  <span className="text-gray-900">{mockEquipment.project}</span>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Comment list */}
          <Card className="border border-gray-200 mb-6">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Seguimiento de la Incidencia</h2>
              
              {/* Initial incident report */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 rounded-full p-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Reporte Inicial</p>
                    <p className="text-sm text-gray-600">{formatDate(incident.createdAt)} - Sistema</p>
                    <p className="mt-2">{incident.description}</p>
                    
                    {incident.photoPath && (
                      <div className="mt-3">
                        <img 
                          src={incident.photoPath} 
                          alt="Foto inicial" 
                          className="rounded-md border border-gray-200 max-h-60 object-contain" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comments list */}
              {incident.comments && incident.comments.length > 0 ? (
                <div className="space-y-4">
                  {incident.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{comment.author}</p>
                          <p className="text-sm text-gray-600">{formatDate(comment.date)}</p>
                          <p className="mt-2">{comment.text}</p>
                          
                          {comment.photoPath && (
                            <div className="mt-3">
                              <img 
                                src={comment.photoPath} 
                                alt="Imagen adjunta" 
                                className="rounded-md border border-gray-200 max-h-60 object-contain" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay comentarios todavía</p>
              )}
              
              {/* Resolution (if resolved) */}
              {incident.status === 'Resuelto' && incident.resolution && (
                <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Resolución</p>
                      <p className="text-sm text-gray-600">{formatDate(incident.resolution.date)} - {incident.resolution.technician}</p>
                      <p className="mt-2">{incident.resolution.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Add comment form */}
          <Card className="border border-gray-200">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Añadir Comentario</h2>
              
              <div className="space-y-4">
                <Input
                  label="Comentario"
                  as="textarea"
                  rows={4}
                  placeholder="Escribe un comentario sobre esta incidencia..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  fullWidth
                />
                
                {capturedImage && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Imagen Adjunta:</p>
                    <div className="relative">
                      <img 
                        src={capturedImage} 
                        alt="Captura" 
                        className="w-full h-40 object-contain border rounded-md" 
                      />
                      <button 
                        className="absolute top-2 right-2 bg-red-100 p-1 rounded-full text-red-600 hover:bg-red-200"
                        onClick={() => setCapturedImage(null)}
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap space-x-2">
                  <Button
                    variant="outline"
                    icon={<Camera className="h-4 w-4" />}
                    onClick={handleStartCamera}
                    disabled={isCameraOpen}
                  >
                    Capturar Imagen
                  </Button>
                  
                  <Button
                    variant="primary"
                    icon={<Send className="h-4 w-4" />}
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                  >
                    Añadir Comentario
                  </Button>
                  
                  {incident.status !== 'Resuelto' && (
                    <Button
                      variant="success"
                      className="ml-auto"
                      icon={<CheckCircle className="h-4 w-4" />}
                      onClick={() => {
                        if (window.confirm("¿Estás seguro de que deseas marcar esta incidencia como resuelta?")) {
                          // Ask for resolution note
                          const note = prompt("Por favor, introduce una nota de resolución:");
                          if (note) {
                            updateIncident(incident.id, { 
                              status: 'Resuelto',
                              resolution: {
                                date: new Date().toISOString(),
                                description: note,
                                technician: 'Usuario Actual'  // In a real app, get this from auth
                              }
                            });
                          }
                        }
                      }}
                    >
                      Resolver Incidencia
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          {/* Equipment Details and Initial Photo */}
          <Card className="border border-gray-200 mb-6">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Equipo Afectado</h2>
              
              <div className="space-y-2">
                <p><span className="font-medium">Nombre:</span> {mockEquipment.name}</p>
                <p><span className="font-medium">Tipo:</span> {mockEquipment.type}</p>
                <p><span className="font-medium">Modelo:</span> {mockEquipment.model}</p>
                <p><span className="font-medium">S/N:</span> {mockEquipment.serialNumber}</p>
                <p><span className="font-medium">Proyecto:</span> {mockEquipment.project}</p>
                <p><span className="font-medium">Pedido:</span> {mockEquipment.order}</p>
                <p><span className="font-medium">Albarán:</span> {mockEquipment.deliveryNote}</p>
              </div>
            </div>
          </Card>
          
          <Card className="border border-gray-200">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Evidencia Fotográfica</h2>
              
              {incident.photoPath ? (
                <div>
                  <img 
                    src={incident.photoPath} 
                    alt="Incidencia" 
                    className="w-full rounded-md border border-gray-200" 
                  />
                  <p className="text-sm text-gray-500 mt-2">Foto inicial de la incidencia</p>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No hay imágenes disponibles</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Camera Modal */}
      <Modal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        title="Capturar Imagen"
        size="lg"
      >
        <div className="space-y-4">
          {cameraError ? (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">Error al acceder a la cámara</h3>
              <p className="text-red-700 mb-4">{cameraError}</p>
              <p className="text-sm text-red-600 mb-4">
                Asegúrate de que tienes una cámara conectada y has concedido los permisos necesarios.
              </p>
              <Button 
                variant="outline"
                onClick={handleCloseCamera}
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ height: '60vh' }}>
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
                  onClick={handleCloseCamera}
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
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

// AlertTriangle icon component
const AlertTriangle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>
);

export default IncidentDetailPage;