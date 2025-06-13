import { Project, Equipment, EstimatedEquipment, Incident } from '../types';
import { exportExcelFile as exportExcelFileFromService } from '../services/fileService';

// Re-export the function from fileService
export const exportExcelFile = exportExcelFileFromService;

export const generateProjectCode = (
  datacenter: string,
  client: string,
  ritmCode: string,
  projectName: string
): string => {
  const datacenterInitial = datacenter.charAt(0).toUpperCase();
  
  // Find first non-zero digit in RITM code
  let ritmWithoutLeadingZeros = '';
  for (let i = 0; i < ritmCode.length; i++) {
    if (ritmCode[i] !== '0' || ritmWithoutLeadingZeros.length > 0) {
      ritmWithoutLeadingZeros += ritmCode[i];
    }
  }
  
  // Create project code without spaces
  return `${datacenterInitial}-${client}-${ritmWithoutLeadingZeros}-${projectName}`.replace(/\s+/g, '');
};

export const calculateProjectProgress = (project: Project): number => {
  if (!project.orders || project.orders.length === 0) return 0;
  
  let verifiedEquipment = 0;
  let totalEstimatedEquipment = project.estimatedEquipment;

  project.orders.forEach(order => {
    order.deliveryNotes.forEach(note => {
      verifiedEquipment += note.verifiedEquipment;
    });
  });

  return totalEstimatedEquipment > 0 
    ? Math.round((verifiedEquipment / totalEstimatedEquipment) * 100) 
    : 0;
};

export const calculateOrderProgress = (order: any): number => {
  if (!order.deliveryNotes || order.deliveryNotes.length === 0) return 0;
  
  let verifiedEquipment = 0;
  order.deliveryNotes.forEach((note: any) => {
    verifiedEquipment += note.verifiedEquipment;
  });

  return order.estimatedEquipment > 0 
    ? Math.round((verifiedEquipment / order.estimatedEquipment) * 100) 
    : 0;
};

export const calculateDeliveryNoteProgress = (deliveryNote: any): number => {
  return deliveryNote.estimatedEquipment > 0 
    ? Math.round((deliveryNote.verifiedEquipment / deliveryNote.estimatedEquipment) * 100) 
    : 0;
};

export const findMatchingEquipment = (
  deliveryEquipment: Equipment[],
  estimatedEquipment: EstimatedEquipment[]
): { [key: string]: string } => {
  const matches: { [key: string]: string } = {};

  deliveryEquipment.forEach(dEquip => {
    if (dEquip.isMatched) return;

    // Find potential matches based on equipment type and model
    const potentialMatches = estimatedEquipment.filter(eEquip => 
      eEquip.type.toLowerCase() === dEquip.type.toLowerCase() &&
      eEquip.model.toLowerCase() === dEquip.model.toLowerCase() &&
      eEquip.assignedEquipmentCount < eEquip.quantity
    );

    if (potentialMatches.length > 0) {
      // Use the first available match
      matches[dEquip.id] = potentialMatches[0].id;
    }
  });

  return matches;
};

export const getMistralAIPrompt = (): string => {
  return `
  Tu tarea es analizar documentos de albaranes de entrega para equipos de datacenter.
  
  Extrae la siguiente información de cada equipo listado en el documento:
  1. Nombre o identificador del equipo
  2. Número de serie (si está disponible)
  3. Número de parte (si está disponible)
  4. Tipo de equipo (servidor, switch, router, storage, etc.)
  5. Modelo del equipo
  
  Organiza la información en formato JSON con la siguiente estructura:
  {
    "equipments": [
      {
        "name": "string",
        "serialNumber": "string",
        "partNumber": "string",
        "type": "string",
        "model": "string"
      }
    ]
  }
  
  Si alguna información no está disponible, devuelve una cadena vacía para ese campo.
  Asegúrate de identificar correctamente todos los equipos listados en el documento.
  `;
};

export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const getNextDeviceName = (prefix: string, datacenter: string, lastNumber: number): string => {
  const newNumber = lastNumber + 1;
  return `${prefix}-${datacenter}-${newNumber.toString().padStart(4, '0')}`;
};

export const formatDate = (date: string): string => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Function to find all incidents related to equipment in a delivery note
export const getIncidentsByDeliveryNoteId = (incidents: Incident[], deliveryNoteId: string, equipments: Equipment[]): Incident[] => {
  // Get all equipment IDs in this delivery note
  const equipmentIds = equipments.map(equipment => equipment.id);
  
  // Filter incidents that are related to these equipment IDs
  return incidents.filter(incident => 
    equipmentIds.includes(incident.equipmentId)
  );
};

// Function to find all incidents related to equipment in an order (across all its delivery notes)
export const getIncidentsByOrderId = (
  incidents: Incident[], 
  order: any // Using 'any' here since the Order type might not include all the nested data we need
): Incident[] => {
  // Get all equipment IDs from all delivery notes in this order
  const equipmentIds: string[] = [];
  
  if (order && order.deliveryNotes) {
    order.deliveryNotes.forEach((note: any) => {
      if (note.equipments) {
        note.equipments.forEach((equipment: Equipment) => {
          equipmentIds.push(equipment.id);
        });
      }
    });
  }
  
  // Filter incidents that are related to these equipment IDs
  return incidents.filter(incident => 
    equipmentIds.includes(incident.equipmentId)
  );
};

// Function to find all incidents related to equipment in a project (across all orders and delivery notes)
export const getIncidentsByProjectId = (
  incidents: Incident[],
  project: any // Using 'any' here since the Project type might not include all the nested data we need
): Incident[] => {
  // Get all equipment IDs from all delivery notes in all orders in this project
  const equipmentIds: string[] = [];
  
  if (project && project.orders) {
    project.orders.forEach((order: any) => {
      if (order.deliveryNotes) {
        order.deliveryNotes.forEach((note: any) => {
          if (note.equipments) {
            note.equipments.forEach((equipment: Equipment) => {
              equipmentIds.push(equipment.id);
            });
          }
        });
      }
    });
  }
  
  // Filter incidents that are related to these equipment IDs
  return incidents.filter(incident => 
    equipmentIds.includes(incident.equipmentId)
  );
};