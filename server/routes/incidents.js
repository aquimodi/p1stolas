import express from 'express';
import { 
  getAllIncidents,
  getIncidentById,
  getIncidentsByProjectId, 
  getIncidentsByEquipmentId,
  createIncident,
  updateIncident,
  deleteIncident,
  addComment,
  resolveIncident
} from '../controllers/incidentController.js';

const router = express.Router();

// Get all incidents
router.get('/', getAllIncidents);

// Get a specific incident by ID
router.get('/:id', getIncidentById);

// Get incidents by project ID
router.get('/project/:projectId', getIncidentsByProjectId);

// Get incidents by equipment ID
router.get('/equipment/:equipmentId', getIncidentsByEquipmentId);

// Create a new incident
router.post('/', createIncident);

// Update an incident
router.put('/:id', updateIncident);

// Delete an incident
router.delete('/:id', deleteIncident);

// Add a comment to an incident
router.post('/:id/comments', addComment);

// Resolve an incident
router.post('/:id/resolve', resolveIncident);

export default router;