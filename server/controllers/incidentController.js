import { logger } from '../utils/logger.js';
import { executeQuery, executeStoredProcedure } from '../utils/dbConnector.js';
import { getSettings } from '../utils/settings.js';
import { sampleIncidents, sampleProjects } from '../data/sampleData.js';
import { generateUniqueId } from '../utils/helpers.js';

// Get all incidents
export const getAllIncidents = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return sample data in demo mode
      return res.json(sampleIncidents);
    }
    
    const query = `
      SELECT i.*,
        e.Name as EquipmentName,
        e.SerialNumber as EquipmentSerialNumber,
        e.Type as EquipmentType,
        e.Model as EquipmentModel,
        dn.Id as DeliveryNoteId,
        dn.Code as DeliveryNoteCode,
        o.Id as OrderId,
        o.Code as OrderCode,
        p.Id as ProjectId,
        p.ProjectName
      FROM Incidents i
      LEFT JOIN Equipments e ON i.EquipmentId = e.Id
      LEFT JOIN DeliveryNotes dn ON e.DeliveryNoteId = dn.Id
      LEFT JOIN Orders o ON dn.OrderId = o.Id
      LEFT JOIN Projects p ON o.ProjectId = p.Id
      ORDER BY i.CreatedAt DESC
    `;
    
    const incidents = await executeQuery(query);

    // Get comments for each incident
    for (const incident of incidents) {
      const commentQuery = `
        SELECT * 
        FROM IncidentComments 
        WHERE IncidentId = @param0
        ORDER BY Date
      `;
      
      incident.comments = await executeQuery(commentQuery, [incident.Id]);
    }
    
    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

// Get a specific incident by ID
export const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Find incident in sample data
      const incident = sampleIncidents.find(inc => inc.id === id);
      
      if (!incident) {
        return res.status(404).json({ message: 'Incidencia no encontrada' });
      }
      
      return res.json(incident);
    }
    
    const query = `
      SELECT i.*,
        e.Name as EquipmentName,
        e.SerialNumber as EquipmentSerialNumber,
        e.Type as EquipmentType,
        e.Model as EquipmentModel,
        dn.Id as DeliveryNoteId,
        dn.Code as DeliveryNoteCode,
        o.Id as OrderId,
        o.Code as OrderCode,
        p.Id as ProjectId,
        p.ProjectName
      FROM Incidents i
      LEFT JOIN Equipments e ON i.EquipmentId = e.Id
      LEFT JOIN DeliveryNotes dn ON e.DeliveryNoteId = dn.Id
      LEFT JOIN Orders o ON dn.OrderId = o.Id
      LEFT JOIN Projects p ON o.ProjectId = p.Id
      WHERE i.Id = @param0
    `;
    
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Incidencia no encontrada' });
    }
    
    const incident = results[0];
    
    // Get comments for this incident
    const commentQuery = `
      SELECT * 
      FROM IncidentComments 
      WHERE IncidentId = @param0
      ORDER BY Date
    `;
    
    incident.comments = await executeQuery(commentQuery, [id]);
    
    res.json(incident);
  } catch (error) {
    next(error);
  }
};

// Get incidents by project ID
export const getIncidentsByProjectId = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // In demo mode, filter sample incidents by project equipment
      // This would require traversing the object graph to find equipment tied to this project
      // For simplicity, we'll just return some sample incidents
      return res.json(sampleIncidents.slice(0, 2));
    }
    
    const query = `
      SELECT i.*
      FROM Incidents i
      JOIN Equipments e ON i.EquipmentId = e.Id
      JOIN DeliveryNotes dn ON e.DeliveryNoteId = dn.Id
      JOIN Orders o ON dn.OrderId = o.Id
      WHERE o.ProjectId = @param0
      ORDER BY i.CreatedAt DESC
    `;
    
    const incidents = await executeQuery(query, [projectId]);
    
    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

// Get incidents by equipment ID
export const getIncidentsByEquipmentId = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Filter sample incidents by equipment
      const filteredIncidents = sampleIncidents.filter(inc => inc.equipmentId === equipmentId);
      return res.json(filteredIncidents);
    }
    
    const query = `
      SELECT *
      FROM Incidents
      WHERE EquipmentId = @param0
      ORDER BY CreatedAt DESC
    `;
    
    const incidents = await executeQuery(query, [equipmentId]);
    
    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

// Create a new incident
export const createIncident = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    const incident = req.body;
    
    if (!incident.equipmentId) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere equipmentId' 
      });
    }
    
    if (!incident.description) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere description' 
      });
    }
    
    if (demoMode) {
      // Just return a success response with a fake ID in demo mode
      return res.status(201).json({ 
        id: `inc${Date.now()}`, 
        ...incident,
        createdAt: new Date().toISOString(),
        comments: []
      });
    }
    
    const result = await executeStoredProcedure('sp_CreateIncident', {
      EquipmentId: incident.equipmentId,
      Description: incident.description,
      Status: incident.status || 'Pendiente',
      PhotoPath: incident.photoPath || null
    });
    
    res.status(201).json({
      id: result[0].Id,
      ...incident,
      createdAt: new Date().toISOString(),
      comments: []
    });
  } catch (error) {
    next(error);
  }
};

// Update an incident
export const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const updates = req.body;
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ id, ...updates });
    }
    
    const query = `
      UPDATE Incidents
      SET 
        Description = COALESCE(@param1, Description),
        Status = COALESCE(@param2, Status),
        PhotoPath = COALESCE(@param3, PhotoPath),
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [
      id,
      updates.description,
      updates.status,
      updates.photoPath
    ]);
    
    // Handle resolution if present
    if (updates.resolution) {
      const resolutionQuery = `
        UPDATE Incidents
        SET 
          ResolutionDate = @param1,
          ResolutionDescription = @param2,
          ResolutionTechnician = @param3,
          Status = 'Resuelto',
          UpdatedAt = GETDATE()
        WHERE Id = @param0
      `;
      
      await executeQuery(query, [
        id,
        updates.resolution.date || new Date().toISOString(),
        updates.resolution.description,
        updates.resolution.technician
      ]);
    }
    
    res.json({ id, ...updates });
  } catch (error) {
    next(error);
  }
};

// Delete an incident
export const deleteIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ message: 'Incidencia eliminada correctamente' });
    }
    
    // Delete comments first
    const deleteCommentsQuery = `DELETE FROM IncidentComments WHERE IncidentId = @param0`;
    await executeQuery(deleteCommentsQuery, [id]);
    
    // Delete incident
    const query = `DELETE FROM Incidents WHERE Id = @param0`;
    await executeQuery(query, [id]);
    
    res.json({ message: 'Incidencia eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

// Add a comment to an incident
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const comment = req.body;
    
    if (!comment.text) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere text' 
      });
    }
    
    if (!comment.author) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere author' 
      });
    }
    
    if (demoMode) {
      // Return success in demo mode with a fake ID
      return res.status(201).json({ 
        id: `comment${Date.now()}`,
        incidentId: id,
        text: comment.text,
        author: comment.author,
        photoPath: comment.photoPath,
        date: new Date().toISOString()
      });
    }
    
    // Check if incident exists
    const checkQuery = `SELECT Id FROM Incidents WHERE Id = @param0`;
    const results = await executeQuery(checkQuery, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Incidencia no encontrada' });
    }
    
    // Add comment
    const commentId = generateUniqueId();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO IncidentComments (Id, IncidentId, Text, Author, PhotoPath, Date)
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5)
    `;
    
    await executeQuery(query, [
      commentId,
      id,
      comment.text,
      comment.author,
      comment.photoPath || null,
      now
    ]);
    
    // If this is the first comment and the status is 'Pendiente', update it to 'En Revisión'
    const countQuery = `SELECT COUNT(*) as CommentCount FROM IncidentComments WHERE IncidentId = @param0`;
    const countResults = await executeQuery(countQuery, [id]);
    
    if (countResults.length > 0 && countResults[0].CommentCount === 1) {
      const incidentQuery = `SELECT Status FROM Incidents WHERE Id = @param0`;
      const incidentResults = await executeQuery(incidentQuery, [id]);
      
      if (incidentResults.length > 0 && incidentResults[0].Status === 'Pendiente') {
        const updateQuery = `
          UPDATE Incidents
          SET 
            Status = 'En Revisión',
            UpdatedAt = GETDATE()
          WHERE Id = @param0
        `;
        
        await executeQuery(updateQuery, [id]);
      }
    }
    
    res.status(201).json({
      id: commentId,
      incidentId: id,
      text: comment.text,
      author: comment.author,
      photoPath: comment.photoPath,
      date: now
    });
  } catch (error) {
    next(error);
  }
};

// Resolve an incident
export const resolveIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const resolution = req.body;
    
    if (!resolution.description) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere description' 
      });
    }
    
    if (!resolution.technician) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere technician' 
      });
    }
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({
        id,
        status: 'Resuelto',
        resolution: {
          date: resolution.date || new Date().toISOString(),
          description: resolution.description,
          technician: resolution.technician
        }
      });
    }
    
    // Update incident status and resolution
    const query = `
      UPDATE Incidents
      SET 
        Status = 'Resuelto',
        ResolutionDate = @param1,
        ResolutionDescription = @param2,
        ResolutionTechnician = @param3,
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [
      id,
      resolution.date || new Date().toISOString(),
      resolution.description,
      resolution.technician
    ]);
    
    // Add a resolution comment
    const commentId = generateUniqueId();
    const now = new Date().toISOString();
    
    const commentQuery = `
      INSERT INTO IncidentComments (Id, IncidentId, Text, Author, Date)
      VALUES (@param0, @param1, @param2, @param3, @param4)
    `;
    
    await executeQuery(commentQuery, [
      commentId,
      id,
      `Resolución: ${resolution.description}`,
      resolution.technician,
      now
    ]);
    
    res.json({
      id,
      status: 'Resuelto',
      resolution: {
        date: resolution.date || new Date().toISOString(),
        description: resolution.description,
        technician: resolution.technician
      },
      comment: {
        id: commentId,
        incidentId: id,
        text: `Resolución: ${resolution.description}`,
        author: resolution.technician,
        date: now
      }
    });
  } catch (error) {
    next(error);
  }
};