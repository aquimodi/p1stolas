import { executeQuery, executeStoredProcedure } from './dbService';
import { Project, Order, DeliveryNote } from '../types';

export const getProjects = async (): Promise<Project[]> => {
  const query = `
    SELECT 
      p.*,
      (SELECT COUNT(*) FROM Orders o WHERE o.ProjectId = p.Id) as OrderCount,
      (SELECT COUNT(*) FROM EstimatedEquipments ee WHERE ee.ProjectId = p.Id) as EquipmentCount
    FROM Projects p
    ORDER BY p.CreatedAt DESC
  `;
  
  return executeQuery<Project>(query);
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
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
  
  const results = await executeQuery(query, [projectId]);
  
  if (results.length === 0) {
    return null;
  }
  
  // Transform the flat results into a nested project object
  const project = results[0] as Project;
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
        const deliveryNote: DeliveryNote = {
          id: row.DeliveryNoteId,
          code: row.DeliveryNoteCode,
          orderId: order.id,
          estimatedEquipment: row.DNEstimatedEquipment,
          progress: row.DNProgress,
          status: row.DNStatus,
          deliveredEquipment: 0,
          verifiedEquipment: 0,
          attachmentPath: '',
          attachmentType: 'doc',
          equipments: []
        };
        order.deliveryNotes.push(deliveryNote);
      }
    }
  });
  
  return project;
};

export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
  const result = await executeStoredProcedure<{ Id: string }>('sp_CreateProject', {
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
  
  return result[0].Id;
};

export const updateProject = async (projectId: string, project: Partial<Project>): Promise<void> => {
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
      OcrMethod = COALESCE(@param9, OcrMethod)
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [
    projectId,
    project.deliveryDate,
    project.datacenter,
    project.projectName,
    project.client,
    project.status,
    project.progress,
    project.teamsUrl,
    project.excelPath,
    project.ocrMethod
  ]);
};