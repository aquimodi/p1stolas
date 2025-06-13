import express from 'express';
import { 
  getAllOrders, 
  getOrderById, 
  getOrdersByProjectId,
  createOrder, 
  updateOrder, 
  deleteOrder 
} from '../controllers/orderController.js';

const router = express.Router();

// Get all orders
router.get('/', getAllOrders);

// Get a specific order by ID
router.get('/:id', getOrderById);

// Get orders by project ID
router.get('/project/:projectId', getOrdersByProjectId);

// Create a new order
router.post('/', createOrder);

// Update an order
router.put('/:id', updateOrder);

// Delete an order
router.delete('/:id', deleteOrder);

export default router;