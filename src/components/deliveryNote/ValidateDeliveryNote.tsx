import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { RefreshCw, Trash2, Save, ArrowDown, CheckCircle, Edit, ListChecks } from 'lucide-react';
import { Equipment, EstimatedEquipment } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { getMistralAIPrompt } from '../../utils/helpers';
import { automaticMatchEquipments as callMistralForMatching } from '../../services/mistralService';

interface ValidateDeliveryNoteProps {
  equipments: Equipment[];
  estimatedEquipments: EstimatedEquipment[];
  onMatch: (equipmentId: string, estimatedEquipmentId: string) => void;
  onUnmatch: (equipmentId: string) => void;
  onUpdateEquipment: (equipmentId: string, data: Partial<Equipment>) => void;
  onAutomaticMatch: () => void;
  isLoading?: boolean;
}

const ValidateDeliveryNote: React.FC<ValidateDeliveryNoteProps> = ({
  equipments,
  estimatedEquipments,
  onMatch,
  onUnmatch,
  onUpdateEquipment,
  onAutomaticMatch,
  isLoading = false
}) => {
  const [unmatchedEquipments, setUnmatchedEquipments] = useState<Equipment[]>([]);
  const [matchedEquipments, setMatchedEquipments] = useState<Equipment[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isMatchAllModalOpen, setIsMatchAllModalOpen] = useState(false);
  
  useEffect(() => {
    // Filter out matched and unmatched equipment
    const matched = equipments.filter(e => e.isMatched);
    const unmatched = equipments.filter(e => !e.isMatched);
    
    setMatchedEquipments(matched);
    setUnmatchedEquipments(unmatched);
  }, [equipments]);
  
  const handleDragEnd = useCallback((result: any) => {
    const { source, destination } = result;
    
    // If dropped outside any droppable area
    if (!destination) return;
    
    // Moving within the same list (reordering)
    if (source.droppableId === destination.droppableId) {
      return;
    }
    
    // If moving from unmatched to an estimated equipment
    if (source.droppableId === 'unmatched' && destination.droppableId.startsWith('estimated-')) {
      const equipmentId = unmatchedEquipments[source.index].id;
      const estimatedEquipmentId = destination.droppableId.split('-')[1];
      
      // Check if this estimated equipment can accept more items
      const estimatedEquipment = estimatedEquipments.find(e => e.id === estimatedEquipmentId);
      
      if (estimatedEquipment && estimatedEquipment.assignedEquipmentCount < estimatedEquipment.quantity) {
        onMatch(equipmentId, estimatedEquipmentId);
      } else {
        alert('Este tipo de equipo ya tiene asignados todos los equipos estimados.');
      }
    }
  }, [unmatchedEquipments, estimatedEquipments, onMatch]);
  
  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };
  
  const handleSaveEquipment = () => {
    if (editingEquipment) {
      onUpdateEquipment(editingEquipment.id, editingEquipment);
      setIsModalOpen(false);
      setEditingEquipment(null);
    }
  };
  
  const handleInputChange = (field: keyof Equipment, value: string) => {
    if (editingEquipment) {
      setEditingEquipment({
        ...editingEquipment,
        [field]: value
      });
    }
  };
  
  const handleAutomaticMatch = async () => {
    setIsAiProcessing(true);
    
    try {
      // Get only unmatched equipments
      const unmatchedForAI = equipments.filter(e => !e.isMatched);
      
      // Get available estimated equipment slots
      const availableEstimated = estimatedEquipments.map(e => ({
        id: e.id,
        type: e.type,
        model: e.model,
        remaining: e.quantity - e.assignedEquipmentCount
      })).filter(e => e.remaining > 0);
      
      // Only process if we have unmatched equipments and available slots
      if (unmatchedForAI.length > 0 && availableEstimated.length > 0) {
        // Prepare prompt for Mistral AI
        const prompt = getMistralAIPrompt();
        
        // Call Mistral AI service
        const matches = await callMistralForMatching(
          unmatchedForAI,
          availableEstimated,
          prompt
        );
        
        // Apply matches one by one
        for (const [equipmentId, estimatedId] of Object.entries(matches)) {
          // Check if the estimated equipment still has capacity
          const estimatedEquipment = estimatedEquipments.find(e => e.id === estimatedId);
          if (estimatedEquipment && estimatedEquipment.assignedEquipmentCount < estimatedEquipment.quantity) {
            onMatch(equipmentId, estimatedId);
          }
        }
        
        // Notify of completion
        alert(`Match automático completado. Se han emparejado ${Object.keys(matches).length} equipos.`);
      } else {
        alert('No hay equipos sin emparejar o no hay slots disponibles en equipos estimados.');
      }
    } catch (error) {
      console.error('Error in automatic matching:', error);
      alert('Error al realizar el emparejamiento automático. Por favor, inténtalo de nuevo.');
    } finally {
      setIsAiProcessing(false);
      onAutomaticMatch(); // Refresh data
    }
  };
  
  const handleMatchAll = () => {
    setIsMatchAllModalOpen(true);
  };
  
  const confirmMatchAll = () => {
    // Close the modal first
    setIsMatchAllModalOpen(false);
    
    // Get unmatched equipments
    const unmatchedForMatching = equipments.filter(e => !e.isMatched);
    if (unmatchedForMatching.length === 0) {
      alert('No hay equipos para emparejar.');
      return;
    }
    
    // Get available estimated equipment slots
    const availableEstimated = [...estimatedEquipments]
      .map(e => ({
        ...e,
        remaining: e.quantity - e.assignedEquipmentCount
      }))
      .filter(e => e.remaining > 0)
      .sort((a, b) => a.type.localeCompare(b.type) || a.model.localeCompare(b.model));
    
    if (availableEstimated.length === 0) {
      alert('No hay slots disponibles en equipos estimados.');
      return;
    }
    
    // Match equipment in order
    let matchCount = 0;
    for (const equipment of unmatchedForMatching) {
      // Find first available estimated equipment slot
      for (const estimatedEquipment of availableEstimated) {
        if (estimatedEquipment.remaining > 0) {
          onMatch(equipment.id, estimatedEquipment.id);
          estimatedEquipment.remaining--;
          matchCount++;
          break;
        }
      }
    }
    
    // Notify of completion
    alert(`Match automático completado. Se han emparejado ${matchCount} equipos.`);
    
    // Refresh data
    onAutomaticMatch();
  };
  
  // Check if all equipment has been matched
  const allEquipmentMatched = unmatchedEquipments.length === 0 && equipments.length > 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Validar Albarán</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="md"
            icon={<ListChecks className="h-4 w-4" />}
            onClick={handleMatchAll}
            disabled={unmatchedEquipments.length === 0}
          >
            Matchar Todos
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={handleAutomaticMatch}
            disabled={isAiProcessing || unmatchedEquipments.length === 0}
          >
            {isAiProcessing ? 'Procesando...' : 'Match Automático con IA'}
          </Button>
        </div>
      </div>
      
      {/* Matched Equipment List - Displayed at the top */}
      {matchedEquipments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Equipos Emparejados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchedEquipments.map((equipment) => {
              // Find the estimated equipment this is matched with
              const matchedEstimated = estimatedEquipments.find(e => e.id === equipment.estimatedEquipmentId);
              
              return (
                <Card key={equipment.id} className="border-l-4 border-l-green-500 border-t border-r border-b border-gray-200">
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <h5 className="font-medium">{matchedEstimated?.type} - {matchedEstimated?.model}</h5>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => onUnmatch(equipment.id)}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Deshacer
                      </Button>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <p className="text-xs text-gray-600">S/N: {equipment.serialNumber || 'No especificado'}</p>
                          <p className="text-xs text-gray-600">P/N: {equipment.partNumber || 'No especificado'}</p>
                          <p className="text-xs text-gray-600">Device: {equipment.deviceName || 'No asignado'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleEditEquipment(equipment)}
                          icon={<Edit className="h-4 w-4" />}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {allEquipmentMatched ? (
        <div className="p-8 bg-green-50 rounded-lg text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700">¡Todos los equipos han sido emparejados!</p>
          <p className="text-gray-600 mt-2">Puedes proceder a la siguiente fase del proceso.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unmatched Equipments */}
            <div>
              <h4 className="text-md font-medium mb-2">Equipos del Albarán</h4>
              <div className="bg-gray-50 p-4 rounded-md min-h-[300px] border border-dashed border-gray-300">
                {unmatchedEquipments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay equipos pendientes de emparejar</p>
                ) : (
                  <Droppable droppableId="unmatched">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2"
                      >
                        {unmatchedEquipments.map((equipment, index) => (
                          <Draggable 
                            key={equipment.id} 
                            draggableId={equipment.id} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-3 rounded shadow-sm border border-gray-200 ${
                                  snapshot.isDragging ? 'shadow-lg border-blue-300' : ''
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                  cursor: 'grab'
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{equipment.name}</p>
                                    <p className="text-sm text-gray-600">Tipo: {equipment.type}</p>
                                    <p className="text-sm text-gray-600">Modelo: {equipment.model}</p>
                                    {equipment.serialNumber && (
                                      <p className="text-sm text-gray-600">S/N: {equipment.serialNumber}</p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditEquipment(equipment)}
                                  >
                                    Editar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            </div>
            
            {/* Estimated Equipments */}
            <div>
              <h4 className="text-md font-medium mb-2">Equipos Estimados del Proyecto</h4>
              <div className="space-y-3">
                {estimatedEquipments.map((estimatedEquipment) => {
                  // Count how many matched equipments are assigned to this estimated equipment
                  const assignedCount = matchedEquipments.filter(e => e.estimatedEquipmentId === estimatedEquipment.id).length;
                  // Check if this estimated equipment can accept more assignments
                  const canAcceptMore = assignedCount < estimatedEquipment.quantity;
                  
                  return (
                    <Card
                      key={estimatedEquipment.id}
                      className={`border ${canAcceptMore ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`}
                    >
                      <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <h5 className="font-medium">{estimatedEquipment.type} - {estimatedEquipment.model}</h5>
                        <p className="text-sm text-gray-600">
                          {assignedCount} de {estimatedEquipment.quantity} asignados
                        </p>
                      </div>
                      
                      {canAcceptMore ? (
                        <Droppable 
                          droppableId={`estimated-${estimatedEquipment.id}`}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`p-4 min-h-[80px] ${
                                snapshot.isDraggingOver ? 'bg-green-50' : 'bg-white'
                              }`}
                              style={{
                                transition: 'background-color 0.2s ease'
                              }}
                            >
                              {assignedCount === 0 ? (
                                <div className="p-2 text-center text-gray-500 flex flex-col items-center justify-center h-20">
                                  <ArrowDown className="h-5 w-5 mb-1" />
                                  <p className="text-sm">Arrastra equipos aquí</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {/* Matched equipments are now shown at the top */}
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : (
                        <div className="p-4 bg-gray-100 text-center text-gray-500">
                          <p className="text-sm">Capacidad completa</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </DragDropContext>
      )}
      
      {/* Edit Equipment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Información del Equipo"
        footer={
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="mr-2"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSaveEquipment}
            >
              Guardar
            </Button>
          </div>
        }
      >
        {editingEquipment && (
          <div className="space-y-4">
            <Input
              label="Nombre del Equipo"
              value={editingEquipment.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
            />
            <Input
              label="Número de Serie"
              value={editingEquipment.serialNumber}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              fullWidth
            />
            <Input
              label="Part Number"
              value={editingEquipment.partNumber}
              onChange={(e) => handleInputChange('partNumber', e.target.value)}
              fullWidth
            />
            <Input
              label="Tipo de Equipo"
              value={editingEquipment.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              fullWidth
            />
            <Input
              label="Modelo"
              value={editingEquipment.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              fullWidth
            />
            <Input
              label="Device Name"
              value={editingEquipment.deviceName}
              onChange={(e) => handleInputChange('deviceName', e.target.value)}
              fullWidth
            />
          </div>
        )}
      </Modal>
      
      {/* Match All Confirmation Modal */}
      <Modal
        isOpen={isMatchAllModalOpen}
        onClose={() => setIsMatchAllModalOpen(false)}
        title="Confirmar Match Automático"
        footer={
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="mr-2"
              onClick={() => setIsMatchAllModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={confirmMatchAll}
            >
              Continuar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Esta acción asignará automáticamente todos los equipos no emparejados a los slots disponibles en orden.
          </p>
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> El emparejamiento se realizará secuencialmente, sin tener en cuenta la compatibilidad específica entre equipos.
              Para un emparejamiento más preciso, utilice la opción "Match Automático con IA" o arrastre manualmente los equipos.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ValidateDeliveryNote;