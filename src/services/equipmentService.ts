import { executeQuery, executeStoredProcedure } from './dbService';
import { Equipment, EstimatedEquipment } from '../types';

export const getEquipmentById = async (equipmentId: string): Promise<Equipment | null> => {
  const query = `
    SELECT 
      e.*,
      ee.Type as EstimatedType,
      ee.Model as EstimatedModel
    FROM Equipments e
    LEFT JOIN EstimatedEquipments ee ON ee.Id = e.EstimatedEquipmentId
    WHERE e.Id = @param0
  `;
  
  const results = await executeQuery<Equipment>(query, [equipmentId]);
  return results.length > 0 ? results[0] : null;
};

export const createEquipment = async (
  equipment: Omit<Equipment, 'id' | 'isVerified' | 'isMatched' | 'matchedWithId' | 'estimatedEquipmentId'>
): Promise<string> => {
  const result = await executeStoredProcedure<{ Id: string }>('sp_CreateEquipment', {
    DeliveryNoteId: equipment.deliveryNoteId,
    Name: equipment.name,
    SerialNumber: equipment.serialNumber,
    PartNumber: equipment.partNumber,
    DeviceName: equipment.deviceName,
    Type: equipment.type,
    Model: equipment.model,
    PhotoPath: equipment.photoPath
  });
  
  return result[0].Id;
};

export const updateEquipment = async (
  equipmentId: string, 
  equipment: Partial<Equipment>
): Promise<void> => {
  const query = `
    UPDATE Equipments
    SET 
      Name = COALESCE(@param1, Name),
      SerialNumber = COALESCE(@param2, SerialNumber),
      PartNumber = COALESCE(@param3, PartNumber),
      DeviceName = COALESCE(@param4, DeviceName),
      Type = COALESCE(@param5, Type),
      Model = COALESCE(@param6, Model),
      IsVerified = COALESCE(@param7, IsVerified),
      PhotoPath = COALESCE(@param8, PhotoPath),
      IsMatched = COALESCE(@param9, IsMatched),
      MatchedWithId = COALESCE(@param10, MatchedWithId),
      EstimatedEquipmentId = COALESCE(@param11, EstimatedEquipmentId)
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [
    equipmentId,
    equipment.name,
    equipment.serialNumber,
    equipment.partNumber,
    equipment.deviceName,
    equipment.type,
    equipment.model,
    equipment.isVerified,
    equipment.photoPath,
    equipment.isMatched,
    equipment.matchedWithId,
    equipment.estimatedEquipmentId
  ]);
};

export const deleteEquipment = async (equipmentId: string): Promise<void> => {
  const query = `
    DELETE FROM Equipments
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [equipmentId]);
};

export const getEquipmentsByDeliveryNoteId = async (deliveryNoteId: string): Promise<Equipment[]> => {
  const query = `
    SELECT 
      e.*,
      ee.Type as EstimatedType,
      ee.Model as EstimatedModel
    FROM Equipments e
    LEFT JOIN EstimatedEquipments ee ON ee.Id = e.EstimatedEquipmentId
    WHERE e.DeliveryNoteId = @param0
    ORDER BY e.Type, e.Model, e.Name
  `;
  
  return executeQuery<Equipment>(query, [deliveryNoteId]);
};

export const matchEquipment = async (
  equipmentId: string, 
  estimatedEquipmentId: string
): Promise<void> => {
  const query = `
    UPDATE Equipments
    SET 
      IsMatched = 1,
      EstimatedEquipmentId = @param1
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [equipmentId, estimatedEquipmentId]);
};

export const unmatchEquipment = async (equipmentId: string): Promise<void> => {
  const query = `
    UPDATE Equipments
    SET 
      IsMatched = 0,
      EstimatedEquipmentId = NULL
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [equipmentId]);
};

export const verifyEquipment = async (
  equipmentId: string, 
  photoPath: string
): Promise<void> => {
  const query = `
    UPDATE Equipments
    SET 
      IsVerified = 1,
      PhotoPath = @param1
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [equipmentId, photoPath]);
};

export const getEstimatedEquipmentById = async (
  estimatedEquipmentId: string
): Promise<EstimatedEquipment | null> => {
  const query = `
    SELECT 
      ee.*,
      (SELECT COUNT(*) FROM Equipments e WHERE e.EstimatedEquipmentId = ee.Id) as AssignedEquipmentCount
    FROM EstimatedEquipments ee
    WHERE ee.Id = @param0
  `;
  
  const results = await executeQuery<EstimatedEquipment>(query, [estimatedEquipmentId]);
  return results.length > 0 ? results[0] : null;
};

export const createEstimatedEquipment = async (
  equipment: Omit<EstimatedEquipment, 'id' | 'assignedEquipmentCount'>
): Promise<string> => {
  const result = await executeStoredProcedure<{ Id: string }>('sp_CreateEstimatedEquipment', {
    ProjectId: equipment.projectId,
    Type: equipment.type,
    Model: equipment.model,
    Quantity: equipment.quantity
  });
  
  return result[0].Id;
};

export const updateEstimatedEquipment = async (
  estimatedEquipmentId: string,
  equipment: Partial<EstimatedEquipment>
): Promise<void> => {
  const query = `
    UPDATE EstimatedEquipments
    SET 
      Type = COALESCE(@param1, Type),
      Model = COALESCE(@param2, Model),
      Quantity = COALESCE(@param3, Quantity)
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [
    estimatedEquipmentId,
    equipment.type,
    equipment.model,
    equipment.quantity
  ]);
};

export const deleteEstimatedEquipment = async (estimatedEquipmentId: string): Promise<void> => {
  // First unmatch any matched equipment
  const unmatchQuery = `
    UPDATE Equipments
    SET 
      IsMatched = 0,
      EstimatedEquipmentId = NULL
    WHERE EstimatedEquipmentId = @param0
  `;
  
  await executeQuery(unmatchQuery, [estimatedEquipmentId]);
  
  // Then delete the estimated equipment
  const deleteQuery = `
    DELETE FROM EstimatedEquipments
    WHERE Id = @param0
  `;
  
  await executeQuery(deleteQuery, [estimatedEquipmentId]);
};

export const getEstimatedEquipmentByProjectId = async (
  projectId: string
): Promise<EstimatedEquipment[]> => {
  const query = `
    SELECT 
      ee.*,
      (SELECT COUNT(*) FROM Equipments e WHERE e.EstimatedEquipmentId = ee.Id) as AssignedEquipmentCount
    FROM EstimatedEquipments ee
    WHERE ee.ProjectId = @param0
    ORDER BY ee.Type, ee.Model
  `;
  
  return executeQuery<EstimatedEquipment>(query, [projectId]);
};