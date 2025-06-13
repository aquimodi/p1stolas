/*
  # Fix SP_UpdateProgress Parameter Issue

  1. Fixes
    - Corrects the parameter handling in sp_UpdateProgress 
    - Removes invalid uniqueidentifier parameter substitution
    - Improves error handling and parameter validation

  2. Changes
    - Drops and recreates sp_UpdateProgress with proper parameter handling
    - Ensures stored procedure properly handles all cases without errors
*/

-- Drop existing procedure if it exists
IF OBJECT_ID('dbo.sp_UpdateProgress', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE sp_UpdateProgress;
END

GO
-- Create improved progress update stored procedure with fixed parameter handling
CREATE PROCEDURE sp_UpdateProgress
    @DeliveryNoteId uniqueidentifier
AS
BEGIN
    -- Declare variables
    DECLARE @OrderId uniqueidentifier;
    DECLARE @ProjectId uniqueidentifier;
    DECLARE @ErrorMessage nvarchar(4000);
    DECLARE @ErrorSeverity int;
    DECLARE @ErrorState int;

    -- Error handling
    BEGIN TRY
        -- Check if DeliveryNote exists
        IF NOT EXISTS (SELECT 1 FROM DeliveryNotes WHERE Id = @DeliveryNoteId)
        BEGIN
            RAISERROR('DeliveryNote with specified ID does not exist', 16, 1);
            RETURN;
        END

        -- Update DeliveryNotes information
        -- Update delivered equipment count
        UPDATE DeliveryNotes
        SET 
            DeliveredEquipment = (
                SELECT COUNT(*) 
                FROM Equipments 
                WHERE DeliveryNoteId = @DeliveryNoteId
            ),
            UpdatedAt = GETDATE()
        WHERE Id = @DeliveryNoteId;

        -- Update verified equipment count
        UPDATE DeliveryNotes
        SET 
            VerifiedEquipment = (
                SELECT COUNT(*) 
                FROM Equipments 
                WHERE DeliveryNoteId = @DeliveryNoteId AND IsVerified = 1
            ),
            UpdatedAt = GETDATE()
        WHERE Id = @DeliveryNoteId;

        -- Update progress based on verified vs. estimated
        UPDATE DeliveryNotes
        SET 
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
        SELECT @OrderId = OrderId FROM DeliveryNotes WHERE Id = @DeliveryNoteId;

        -- Update Order progress based on DeliveryNotes progress
        IF @OrderId IS NOT NULL
        BEGIN
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
            SELECT @ProjectId = ProjectId FROM Orders WHERE Id = @OrderId;

            -- Update Project progress based on Orders progress
            IF @ProjectId IS NOT NULL
            BEGIN
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
        END
    END TRY
    BEGIN CATCH
        -- Capture error details
        SELECT 
            @ErrorMessage = ERROR_MESSAGE(),
            @ErrorSeverity = ERROR_SEVERITY(),
            @ErrorState = ERROR_STATE();
        
        -- Re-raise the error
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- Add or update trigger for automatic status updates
IF OBJECT_ID('dbo.tr_DeliveryNotes_SetStatus', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER tr_DeliveryNotes_SetStatus;
END

GO
CREATE TRIGGER tr_DeliveryNotes_SetStatus
ON DeliveryNotes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if the Progress or VerifiedEquipment columns were updated
    IF UPDATE(Progress) OR UPDATE(VerifiedEquipment) OR UPDATE(DeliveredEquipment)
    BEGIN
        -- Set the status based on the progress and verification
        UPDATE dn
        SET 
            Status = CASE
                WHEN i.Progress = 100 THEN 'Completado'
                WHEN i.VerifiedEquipment > 0 THEN 'Validando Recepción'
                WHEN i.DeliveredEquipment > 0 THEN 'Validando Albarán'
                ELSE 'Pendiente'
            END
        FROM DeliveryNotes dn
        INNER JOIN inserted i ON dn.Id = i.Id
        WHERE i.Status <> 'Completado'; -- Don't change status if already completed
    END
END