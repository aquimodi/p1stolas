import express from 'express';
import { 
  getAllEquipment,
  getEquipmentById, 
  getEquipmentByDeliveryNoteId,
  createEquipment, 
  updateEquipment, 
  deleteEquipment,
  matchEquipment,
  unmatchEquipment,
  verifyEquipment,
  automaticMatchEquipment
} from '../controllers/equipmentController.js';

const router = express.Router();

// Get all equipment
router.get('/', getAllEquipment);

// Get a specific equipment by ID
router.get('/:id', getEquipmentById);

// Get equipment by delivery note ID
router.get('/delivery-note/:deliveryNoteId', getEquipmentByDeliveryNoteId);

// Create a new equipment
router.post('/', createEquipment);

// Update equipment
router.put('/:id', updateEquipment);

// Delete equipment
router.delete('/:id', deleteEquipment);

// Match equipment with estimated equipment
router.post('/:id/match', matchEquipment);

// Unmatch equipment
router.post('/:id/unmatch', unmatchEquipment);

// Verify equipment
router.post('/:id/verify', verifyEquipment);

// Automatic match of equipment using AI
router.post('/delivery-note/:deliveryNoteId/automatic-match', automaticMatchEquipment);

export default router;