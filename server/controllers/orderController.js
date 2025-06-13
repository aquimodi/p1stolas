import { logger } from '../utils/logger.js';
import { executeQuery, executeStoredProcedure } from '../utils/dbConnector.js';
import { getSettings } from '../utils/settings.js';
import { sampleProjects } from '../data/sampleData.js';

// Get all orders
export const getAllOrders = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Extract all orders from sample projects in demo mode
      const orders = [];
      sampleProjects.forEach(project => {
        project.orders.forEach(order => {
          orders.push({
            ...order,
            projectName: project.projectName,
            projectCode: project.projectCode,
            client: project.client
          });
        });
      });
      
      return res.json(orders);
    }
    
    const query = `
      SELECT 
        o.*,
        p.ProjectName,
        p.ProjectCode,
        p.Client,
        (SELECT COUNT(*) FROM DeliveryNotes dn WHERE dn.OrderId = o.Id) as DeliveryNoteCount
      FROM Orders o
      JOIN Projects p ON o.ProjectId = p.Id
      ORDER BY o.CreatedAt DESC
    `;
    
    const orders = await executeQuery(query);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Get a specific order by ID
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Find order in sample projects
      let foundOrder = null;
      
      sampleProjects.forEach(project => {
        const order = project.orders.find(o => o.id === id);
        if (order) {
          foundOrder = {
            ...order,
            projectId: project.id,
            projectName: project.projectName,
            projectCode: project.projectCode,
            client: project.client
          };
        }
      });
      
      if (!foundOrder) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }
      
      return res.json(foundOrder);
    }
    
    const query = `
      SELECT 
        o.*,
        p.ProjectName,
        p.ProjectCode,
        p.Client,
        dn.Id as DeliveryNoteId,
        dn.Code as DeliveryNoteCode,
        dn.EstimatedEquipment as DeliveryNoteEstimatedEquipment,
        dn.DeliveredEquipment as DeliveryNoteDeliveredEquipment,
        dn.VerifiedEquipment as DeliveryNoteVerifiedEquipment,
        dn.Status as DeliveryNoteStatus,
        dn.Progress as DeliveryNoteProgress
      FROM Orders o
      JOIN Projects p ON o.ProjectId = p.Id
      LEFT JOIN DeliveryNotes dn ON dn.OrderId = o.Id
      WHERE o.Id = @param0
    `;
    
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Transform the flat results into a nested order object
    const order = results[0];
    order.deliveryNotes = [];
    
    results.forEach(row => {
      if (row.DeliveryNoteId) {
        order.deliveryNotes.push({
          id: row.DeliveryNoteId,
          code: row.DeliveryNoteCode,
          orderId: order.Id,
          estimatedEquipment: row.DeliveryNoteEstimatedEquipment,
          deliveredEquipment: row.DeliveryNoteDeliveredEquipment,
          verifiedEquipment: row.DeliveryNoteVerifiedEquipment,
          status: row.DeliveryNoteStatus,
          progress: row.DeliveryNoteProgress
        });
      }
    });
    
    // Remove nested properties from the order object
    delete order.DeliveryNoteId;
    delete order.DeliveryNoteCode;
    delete order.DeliveryNoteEstimatedEquipment;
    delete order.DeliveryNoteDeliveredEquipment;
    delete order.DeliveryNoteVerifiedEquipment;
    delete order.DeliveryNoteStatus;
    delete order.DeliveryNoteProgress;
    
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Get orders by project ID
export const getOrdersByProjectId = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Find project in sample projects
      const project = sampleProjects.find(p => p.id === projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }
      
      return res.json(project.orders || []);
    }
    
    const query = `
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM DeliveryNotes dn WHERE dn.OrderId = o.Id) as DeliveryNoteCount
      FROM Orders o
      WHERE o.ProjectId = @param0
      ORDER BY o.CreatedAt DESC
    `;
    
    const orders = await executeQuery(query, [projectId]);
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Create a new order
export const createOrder = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    const order = req.body;
    
    if (!order.projectId) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere projectId' 
      });
    }
    
    if (!order.code) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere code' 
      });
    }
    
    if (demoMode) {
      // Just return a success response with a fake ID in demo mode
      return res.status(201).json({ 
        id: `demo-${Date.now()}`, 
        ...order,
        progress: 0,
        deliveryNotes: [],
        createdAt: new Date().toISOString()
      });
    }
    
    const result = await executeStoredProcedure('sp_CreateOrder', {
      ProjectId: order.projectId,
      Code: order.code,
      EstimatedEquipment: order.estimatedEquipment || 0
    });
    
    res.status(201).json({
      id: result[0].Id,
      ...order,
      progress: 0,
      deliveryNotes: [],
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Update an order
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const updates = req.body;
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ id, ...updates });
    }
    
    const query = `
      UPDATE Orders
      SET 
        Code = COALESCE(@param1, Code),
        EstimatedEquipment = COALESCE(@param2, EstimatedEquipment),
        Progress = COALESCE(@param3, Progress),
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [
      id,
      updates.code,
      updates.estimatedEquipment,
      updates.progress
    ]);
    
    res.json({ id, ...updates });
  } catch (error) {
    next(error);
  }
};

// Delete an order
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ message: 'Pedido eliminado correctamente' });
    }
    
    // In a real application, we might want to use a stored procedure for this
    // to ensure all related data is also deleted or handled appropriately
    const query = `DELETE FROM Orders WHERE Id = @param0`;
    
    await executeQuery(query, [id]);
    
    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};