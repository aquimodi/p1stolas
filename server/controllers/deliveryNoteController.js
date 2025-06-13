import { logger } from '../utils/logger.js';
import { executeQuery, executeStoredProcedure } from '../utils/dbConnector.js';
import { getSettings } from '../utils/settings.js';
import { sampleProjects } from '../data/sampleData.js';

// Get all delivery notes
export const getAllDeliveryNotes = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Extract all delivery notes from sample projects in demo mode
      const deliveryNotes = [];
      sampleProjects.forEach(project => {
        project.orders.forEach(order => {
          if (order.deliveryNotes) {
            order.deliveryNotes.forEach(note => {
              deliveryNotes.push({
                ...note,
                projectId: project.id,
                projectName: project.projectName,
                orderCode: order.code,
              });
            });
          }
        });
      });
      
      return res.json(deliveryNotes);
    }
    
    const query = `
      SELECT 
        dn.*,
        o.Code as OrderCode,
        p.Id as ProjectId,
        p.ProjectName,
        p.ProjectCode,
        p.Client
      FROM DeliveryNotes dn
      JOIN Orders o ON dn.OrderId = o.Id
      JOIN Projects p ON o.ProjectId = p.Id
      ORDER BY dn.CreatedAt DESC
    `;
    
    const deliveryNotes = await executeQuery(query);
    res.json(deliveryNotes);
  } catch (error) {
    next(error);
  }
};

// Get a specific delivery note by ID
export const getDeliveryNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Find delivery note in sample projects
      let foundNote = null;
      let foundProject = null;
      let foundOrder = null;
      
      sampleProjects.forEach(project => {
        project.orders.forEach(order => {
          if (order.deliveryNotes) {
            const note = order.deliveryNotes.find(n => n.id === id);
            if (note) {
              foundNote = { ...note };
              foundProject = project;
              foundOrder = order;
            }
          }
        });
      });
      
      if (!foundNote) {
        return res.status(404).json({ message: 'Albarán no encontrado' });
      }
      
      // Add project and order info
      foundNote.projectId = foundProject.id;
      foundNote.projectName = foundProject.projectName;
      foundNote.projectCode = foundProject.projectCode;
      foundNote.orderCode = foundOrder.code;
      
      return res.json(foundNote);
    }
    
    const query = `
      SELECT 
        dn.*,
        o.Code as OrderCode,
        p.Id as ProjectId,
        p.ProjectName,
        p.ProjectCode,
        p.Client
      FROM DeliveryNotes dn
      JOIN Orders o ON dn.OrderId = o.Id
      JOIN Projects p ON o.ProjectId = p.Id
      WHERE dn.Id = @param0
    `;
    
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Albarán no encontrado' });
    }
    
    const deliveryNote = results[0];
    
    // Get equipment for this delivery note
    const equipmentQuery = `
      SELECT *
      FROM Equipments
      WHERE DeliveryNoteId = @param0
    `;
    
    deliveryNote.equipments = await executeQuery(equipmentQuery, [id]);
    
    res.json(deliveryNote);
  } catch (error) {
    next(error);
  }
};

// Get delivery notes by order ID
export const getDeliveryNotesByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Find order in sample projects
      let foundDeliveryNotes = [];
      
      sampleProjects.forEach(project => {
        project.orders.forEach(order => {
          if (order.id === orderId && order.deliveryNotes) {
            foundDeliveryNotes = order.deliveryNotes;
          }
        });
      });
      
      return res.json(foundDeliveryNotes);
    }
    
    const query = `
      SELECT *
      FROM DeliveryNotes
      WHERE OrderId = @param0
      ORDER BY CreatedAt DESC
    `;
    
    const deliveryNotes = await executeQuery(query, [orderId]);
    
    res.json(deliveryNotes);
  } catch (error) {
    next(error);
  }
};

// Create a new delivery note
export const createDeliveryNote = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    const deliveryNote = req.body;
    
    if (!deliveryNote.orderId) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere orderId' 
      });
    }
    
    if (!deliveryNote.code) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere code' 
      });
    }
    
    if (demoMode) {
      // Just return a success response with a fake ID in demo mode
      return res.status(201).json({ 
        id: `demo-${Date.now()}`, 
        ...deliveryNote,
        deliveredEquipment: 0,
        verifiedEquipment: 0,
        progress: 0,
        status: 'Pendiente',
        equipments: [],
        createdAt: new Date().toISOString()
      });
    }
    
    const result = await executeStoredProcedure('sp_CreateDeliveryNote', {
      OrderId: deliveryNote.orderId,
      Code: deliveryNote.code,
      EstimatedEquipment: deliveryNote.estimatedEquipment || 0,
      Status: deliveryNote.status || 'Pendiente',
      AttachmentPath: deliveryNote.attachmentPath || null,
      AttachmentType: deliveryNote.attachmentType || null
    });
    
    res.status(201).json({
      id: result[0].Id,
      ...deliveryNote,
      deliveredEquipment: 0,
      verifiedEquipment: 0,
      progress: 0,
      status: 'Pendiente',
      equipments: [],
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Update a delivery note
export const updateDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const updates = req.body;
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ id, ...updates });
    }
    
    const query = `
      UPDATE DeliveryNotes
      SET 
        Code = COALESCE(@param1, Code),
        EstimatedEquipment = COALESCE(@param2, EstimatedEquipment),
        Status = COALESCE(@param3, Status),
        AttachmentPath = COALESCE(@param4, AttachmentPath),
        AttachmentType = COALESCE(@param5, AttachmentType),
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [
      id,
      updates.code,
      updates.estimatedEquipment,
      updates.status,
      updates.attachmentPath,
      updates.attachmentType
    ]);
    
    // Update progress using stored procedure
    await executeStoredProcedure('sp_UpdateProgress', {
      DeliveryNoteId: id
    });
    
    res.json({ id, ...updates });
  } catch (error) {
    next(error);
  }
};

// Delete a delivery note
export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ message: 'Albarán eliminado correctamente' });
    }
    
    // Get the order ID before deleting
    const getOrderIdQuery = `
      SELECT OrderId FROM DeliveryNotes WHERE Id = @param0
    `;
    const orderResult = await executeQuery(getOrderIdQuery, [id]);
    const orderId = orderResult.length > 0 ? orderResult[0].OrderId : null;
    
    // Delete any equipment associated with this delivery note
    const deleteEquipmentQuery = `
      DELETE FROM Equipments WHERE DeliveryNoteId = @param0
    `;
    await executeQuery(deleteEquipmentQuery, [id]);
    
    // Delete the delivery note
    const query = `DELETE FROM DeliveryNotes WHERE Id = @param0`;
    await executeQuery(query, [id]);
    
    // If we have an order ID, update the order and project progress
    if (orderId) {
      const updateOrderQuery = `
        UPDATE Orders
        SET 
          Progress = (
            SELECT 
              CASE
                WHEN COUNT(dn.Id) = 0 THEN 0
                ELSE AVG(dn.Progress)
              END
            FROM DeliveryNotes dn
            WHERE dn.OrderId = @param0
          ),
          UpdatedAt = GETDATE()
        WHERE Id = @param0
      `;
      
      await executeQuery(updateOrderQuery, [orderId]);
      
      // Get project ID
      const getProjectIdQuery = `
        SELECT ProjectId FROM Orders WHERE Id = @param0
      `;
      const projectResult = await executeQuery(getProjectIdQuery, [orderId]);
      const projectId = projectResult.length > 0 ? projectResult[0].ProjectId : null;
      
      if (projectId) {
        const updateProjectQuery = `
          UPDATE Projects
          SET 
            Progress = (
              SELECT 
                CASE
                  WHEN COUNT(o.Id) = 0 THEN 0
                  ELSE AVG(o.Progress)
                END
              FROM Orders o
              WHERE o.ProjectId = @param0
            ),
            UpdatedAt = GETDATE()
          WHERE Id = @param0
        `;
        
        await executeQuery(updateProjectQuery, [projectId]);
      }
    }
    
    res.json({ message: 'Albarán eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Verify a delivery note (validate all equipment)
export const verifyDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ 
        message: 'Albarán verificado correctamente',
        status: 'Completado',
        progress: 100
      });
    }
    
    // Update all equipment to verified
    const equipmentQuery = `
      UPDATE Equipments
      SET 
        IsVerified = 1,
        UpdatedAt = GETDATE()
      WHERE DeliveryNoteId = @param0 AND IsMatched = 1
    `;
    
    await executeQuery(equipmentQuery, [id]);
    
    // Update delivery note status
    const updateQuery = `
      UPDATE DeliveryNotes
      SET 
        Status = 'Completado',
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(updateQuery, [id]);
    
    // Update progress using the new stored procedure
    await executeStoredProcedure('sp_UpdateProgress', {
      DeliveryNoteId: id
    });
    
    res.json({ 
      message: 'Albarán verificado correctamente',
      status: 'Completado',
      progress: 100
    });
  } catch (error) {
    next(error);
  }
};

// Send to DCIM
export const sendToDCIM = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ 
        message: 'Información enviada al DCIM correctamente',
        status: 'Completado',
        sentToDCIM: true,
        dcimReference: `DCIM-REF-${Date.now().toString().substring(5)}`
      });
    }
    
    // Update delivery note status
    const updateQuery = `
      UPDATE DeliveryNotes
      SET 
        Status = 'Completado',
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(updateQuery, [id]);
    
    // Update progress using the new stored procedure
    await executeStoredProcedure('sp_UpdateProgress', {
      DeliveryNoteId: id
    });
    
    // In a real implementation, this would integrate with the DCIM system
    // For now, just return success
    
    res.json({ 
      message: 'Información enviada al DCIM correctamente',
      status: 'Completado',
      sentToDCIM: true,
      dcimReference: `DCIM-REF-${Date.now().toString().substring(5)}`
    });
  } catch (error) {
    next(error);
  }
};