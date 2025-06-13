/*
  # Add Progress Calculation Stored Procedure

  1. New Stored Procedure
    - `sp_UpdateProgress`: Updates progress fields across all levels
    - Takes a delivery note ID and updates progress for the note, its parent order, and project
    - Calculates progress based on verified equipment
    - Includes safety checks to prevent division by zero
    - Updates timestamps for all modified records

  2. Benefits
    - Centralizes progress calculation logic in the database
    - Ensures consistent progress updates throughout the application
    - Reduces redundant code in controllers
    - Makes progress calculations more efficient and reliable
*/

GO
CREATE PROCEDURE sp_UpdateProgress
  @DeliveryNoteId uniqueidentifier
AS
BEGIN
  -- Update DeliveryNote progress
  UPDATE DeliveryNotes
  SET 
    VerifiedEquipment = (
      SELECT COUNT(*) 
      FROM Equipments 
      WHERE DeliveryNoteId = @DeliveryNoteId AND IsVerified = 1
    ),
    Progress = CASE
      WHEN EstimatedEquipment = 0 THEN 0  -- Avoid division by zero
      ELSE (
        SELECT CAST(COUNT(*) * 100.0 / NULLIF(EstimatedEquipment, 0) AS INT)
        FROM Equipments 
        WHERE DeliveryNoteId = @DeliveryNoteId AND IsVerified = 1
      )
    END,
    UpdatedAt = GETDATE()
  WHERE Id = @DeliveryNoteId;

  -- Get the OrderId from the DeliveryNote
  DECLARE @OrderId uniqueidentifier;
  SELECT @OrderId = OrderId FROM DeliveryNotes WHERE Id = @DeliveryNoteId;

  -- Update Order progress
  UPDATE Orders
  SET 
    Progress = (
      SELECT 
        CASE
          WHEN COUNT(dn.Id) = 0 THEN 0  -- Avoid division by zero
          ELSE AVG(dn.Progress)
        END
      FROM DeliveryNotes dn
      WHERE dn.OrderId = @OrderId
    ),
    UpdatedAt = GETDATE()
  WHERE Id = @OrderId;

  -- Get the ProjectId from the Order
  DECLARE @ProjectId uniqueidentifier;
  SELECT @ProjectId = ProjectId FROM Orders WHERE Id = @OrderId;

  -- Update Project progress
  UPDATE Projects
  SET 
    Progress = (
      SELECT 
        CASE
          WHEN COUNT(o.Id) = 0 THEN 0  -- Avoid division by zero
          ELSE AVG(o.Progress)
        END
      FROM Orders o
      WHERE o.ProjectId = @ProjectId
    ),
    UpdatedAt = GETDATE()
  WHERE Id = @ProjectId;
END