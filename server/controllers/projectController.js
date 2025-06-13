import { logger } from '../utils/logger.js';
import { executeQuery, executeStoredProcedure } from '../utils/dbConnector.js';
import { getSettings } from '../utils/settings.js';
import { sampleProjects } from '../data/sampleData.js';

// Get all projects
export const getAllProjects = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return sample data in demo mode
      return res.json(sampleProjects);
    }
    
    const query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM Orders o WHERE o.ProjectId = p.Id) as OrderCount,
        (SELECT COUNT(*) FROM EstimatedEquipments ee WHERE ee.ProjectId = p.Id) as EquipmentCount
      FROM Projects p
      ORDER BY p.CreatedAt DESC
    `;
    
    const projects = await executeQuery(query);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Get a specific project by ID
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return sample data in demo mode
      const project = sampleProjects.find(p => p.id === id);
      if (!project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }
      return res.json(project);
    }
    
    const query = `
      SELECT 
        p.*,
        o.Id as OrderId,
        o.Code as OrderCode,
        o.EstimatedEquipment as OrderEstimatedEquipment,
        o.Progress as OrderProgress,
        dn.Id as DeliveryNoteId,
        dn.Code as DeliveryNoteCode,
        dn.EstimatedEquipment as DNEstimatedEquipment,
        dn.Progress as DNProgress,
        dn.Status as DNStatus
      FROM Projects p
      LEFT JOIN Orders o ON o.ProjectId = p.Id
      LEFT JOIN DeliveryNotes dn ON dn.OrderId = o.Id
      WHERE p.Id = @param0
    `;
    
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Transform the flat results into a nested project object
    const project = results[0];
    project.orders = [];
    
    results.forEach(row => {
      if (row.OrderId) {
        let order = project.orders.find(o => o.id === row.OrderId);
        if (!order) {
          order = {
            id: row.OrderId,
            code: row.OrderCode,
            projectId: project.id,
            estimatedEquipment: row.OrderEstimatedEquipment,
            progress: row.OrderProgress,
            deliveryNotes: []
          };
          project.orders.push(order);
        }
        
        if (row.DeliveryNoteId) {
          order.deliveryNotes.push({
            id: row.DeliveryNoteId,
            code: row.DeliveryNoteCode,
            orderId: order.id,
            estimatedEquipment: row.DNEstimatedEquipment,
            progress: row.DNProgress,
            status: row.DNStatus
          });
        }
      }
    });
    
    res.json(project);
  } catch (error) {
    next(error);
  }
};

// Create a new project
export const createProject = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    const project = req.body;
    
    if (demoMode) {
      // Just return a success response with a fake ID in demo mode
      return res.status(201).json({ 
        id: `demo-${Date.now()}`, 
        ...project,
        createdAt: new Date().toISOString()
      });
    }
    
    const result = await executeStoredProcedure('sp_CreateProject', {
      DeliveryDate: project.deliveryDate,
      Datacenter: project.datacenter,
      ProjectName: project.projectName,
      Client: project.client,
      RitmCode: project.ritmCode,
      ProjectCode: project.projectCode,
      EstimatedEquipment: project.estimatedEquipment,
      Status: project.status,
      Progress: project.progress,
      TeamsUrl: project.teamsUrl,
      ExcelPath: project.excelPath,
      OcrMethod: project.ocrMethod
    });
    
    res.status(201).json({
      id: result[0].Id,
      ...project,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Update a project
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const updates = req.body;
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ id, ...updates });
    }
    
    const query = `
      UPDATE Projects
      SET 
        DeliveryDate = COALESCE(@param1, DeliveryDate),
        Datacenter = COALESCE(@param2, Datacenter),
        ProjectName = COALESCE(@param3, ProjectName),
        Client = COALESCE(@param4, Client),
        Status = COALESCE(@param5, Status),
        Progress = COALESCE(@param6, Progress),
        TeamsUrl = COALESCE(@param7, TeamsUrl),
        ExcelPath = COALESCE(@param8, ExcelPath),
        OcrMethod = COALESCE(@param9, OcrMethod),
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [
      id,
      updates.deliveryDate,
      updates.datacenter,
      updates.projectName,
      updates.client,
      updates.status,
      updates.progress,
      updates.teamsUrl,
      updates.excelPath,
      updates.ocrMethod
    ]);
    
    res.json({ id, ...updates });
  } catch (error) {
    next(error);
  }
};

// Delete a project
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ message: 'Proyecto eliminado correctamente' });
    }
    
    // In a real application, we might want to use a stored procedure for this
    // to ensure all related data is also deleted or handled appropriately
    const query = `DELETE FROM Projects WHERE Id = @param0`;
    
    await executeQuery(query, [id]);
    
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Get all equipment for a project
export const getProjectEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return sample data in demo mode
      const project = sampleProjects.find(p => p.id === id);
      if (!project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }
      
      const equipment = [];
      project.orders.forEach(order => {
        order.deliveryNotes.forEach(note => {
          equipment.push(...note.equipments);
        });
      });
      
      return res.json(equipment);
    }
    
    const query = `
      SELECT e.*
      FROM Equipments e
      JOIN DeliveryNotes dn ON e.DeliveryNoteId = dn.Id
      JOIN Orders o ON dn.OrderId = o.Id
      WHERE o.ProjectId = @param0
    `;
    
    const equipment = await executeQuery(query, [id]);
    
    res.json(equipment);
  } catch (error) {
    next(error);
  }
};