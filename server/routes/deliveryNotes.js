import express from 'express';
import { 
  getAllDeliveryNotes, 
  getDeliveryNoteById, 
  getDeliveryNotesByOrderId,
  createDeliveryNote, 
  updateDeliveryNote, 
  deleteDeliveryNote,
  verifyDeliveryNote,
  sendToDCIM
} from '../controllers/deliveryNoteController.js';

const router = express.Router();

// Get all delivery notes
router.get('/', getAllDeliveryNotes);

// Get a specific delivery note by ID
router.get('/:id', getDeliveryNoteById);

// Get delivery notes by order ID
router.get('/order/:orderId', getDeliveryNotesByOrderId);

// Create a new delivery note
router.post('/', createDeliveryNote);

// Update a delivery note
router.put('/:id', updateDeliveryNote);

// Delete a delivery note
router.delete('/:id', deleteDeliveryNote);

// Verify a delivery note (validate all equipment)
router.post('/:id/verify', verifyDeliveryNote);

// Send to DCIM
router.post('/:id/send-to-dcim', sendToDCIM);

export default router;