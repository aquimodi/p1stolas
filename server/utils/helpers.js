// Function to generate project code
export const generateProjectCode = (
  datacenter,
  client,
  ritmCode,
  projectName
) => {
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

// Function to calculate project progress
export const calculateProjectProgress = (project) => {
  if (!project.orders || project.orders.length === 0) return 0;
  
  let verifiedEquipment = 0;
  let totalEstimatedEquipment = project.estimatedEquipment;

  project.orders.forEach(order => {
    if (order.deliveryNotes) {
      order.deliveryNotes.forEach(note => {
        verifiedEquipment += note.verifiedEquipment || 0;
      });
    }
  });

  return totalEstimatedEquipment > 0 
    ? Math.round((verifiedEquipment / totalEstimatedEquipment) * 100) 
    : 0;
};

// Function to generate a unique ID
export const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Function to get a Mistral AI prompt for document analysis
export const getMistralAIPrompt = () => {
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

// Function to format a date string
export const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Format file size to human readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};