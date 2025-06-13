/*
  # Fix Progress Calculation and AIProvider References

  1. Improvements
    - Fixed AIProviderId column reference issues
    - Made stored procedures safer with DROP/CREATE IF EXISTS pattern
    - Added better error handling in stored procedures
    - Added trigger for automatic status updates based on progress

  2. Changes
    - Uses proper EXISTS checks before attempting any references to AIProviderId
    - Improves delivery note status handling with a dedicated trigger
    - Updates progress calculation in sp_UpdateProgress to be more robust
    - Fixes potential division by zero errors
*/

-- Make stored procedures safer with proper checks and error handling
-- First drop them if they exist to avoid the "already exists" error
IF OBJECT_ID('dbo.sp_GetAIProviderDetails', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE sp_GetAIProviderDetails;
END

IF OBJECT_ID('dbo.sp_UpdateProgress', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE sp_UpdateProgress;
END

GO
-- Create improved AI provider details stored procedure
CREATE PROCEDURE sp_GetAIProviderDetails
    @ProjectId uniqueidentifier = NULL,
    @ProviderName nvarchar(50) = NULL
AS
BEGIN
    -- Error handling
    BEGIN TRY
        -- Check if AIProviders table exists before querying it
        IF OBJECT_ID('dbo.AIProviders', 'U') IS NOT NULL
        BEGIN
            -- Check if Projects table has AIProviderId column before querying it
            IF EXISTS (
                SELECT 1
                FROM sys.columns
                WHERE object_id = OBJECT_ID('Projects') AND name = 'AIProviderId'
            )
            BEGIN
                IF @ProjectId IS NOT NULL
                BEGIN
                    -- Get AI provider from project
                    SELECT ap.*
                    FROM AIProviders ap
                    JOIN Projects p ON p.AIProviderId = ap.Id
                    WHERE p.Id = @ProjectId;
                END
                ELSE IF @ProviderName IS NOT NULL
                BEGIN
                    -- Get AI provider by name
                    SELECT *
                    FROM AIProviders
                    WHERE Name = @ProviderName;
                END
                ELSE
                BEGIN
                    -- Get default AI provider
                    SELECT TOP 1 *
                    FROM AIProviders
                    WHERE IsDefault = 1
                    ORDER BY CreatedAt DESC;
                END
            END
            ELSE
            BEGIN
                -- If AIProviderId doesn't exist in Projects, just get by name or default
                IF @ProviderName IS NOT NULL
                BEGIN
                    SELECT *
                    FROM AIProviders
                    WHERE Name = @ProviderName;
                END
                ELSE
                BEGIN
                    -- Get default AI provider
                    SELECT TOP 1 *
                    FROM AIProviders
                    WHERE IsDefault = 1
                    ORDER BY CreatedAt DESC;
                END
            END
        END
        ELSE
        BEGIN
            -- AIProviders table doesn't exist, return empty result
            SELECT 
                CAST(NULL AS uniqueidentifier) AS Id,
                'MistralAI' AS Name,
                'your_api_key_here' AS ApiKey,
                'mistral-large-latest' AS Model,
                NULL AS Endpoint,
                NULL AS Version,
                1 AS IsDefault,
                GETDATE() AS CreatedAt,
                GETDATE() AS UpdatedAt;
        END
    END TRY
    BEGIN CATCH
        -- Handle any errors
        DECLARE @ErrorMessage nvarchar(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity int = ERROR_SEVERITY();
        DECLARE @ErrorState int = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END

GO
-- Create improved progress update stored procedure
CREATE PROCEDURE sp_UpdateProgress
    @DeliveryNoteId uniqueidentifier
AS
BEGIN
    -- Error handling
    BEGIN TRY
        -- Check if DeliveryNote exists
        IF NOT EXISTS (SELECT 1 FROM DeliveryNotes WHERE Id = @DeliveryNoteId)
        BEGIN
            RAISERROR('DeliveryNote with ID %s does not exist', 16, 1, @DeliveryNoteId);
            RETURN;
        END

        -- Update DeliveryNotes information first
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
        DECLARE @OrderId uniqueidentifier;
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
            DECLARE @ProjectId uniqueidentifier;
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
        -- Log error (in a real system, you would log to a table or external system)
        DECLARE @ErrorMessage nvarchar(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity int = ERROR_SEVERITY();
        DECLARE @ErrorState int = ERROR_STATE();
        
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
        WHERE dn.Status <> 'Completado'; -- Don't change status if already completed
    END
END