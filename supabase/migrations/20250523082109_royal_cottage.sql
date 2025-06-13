/*
  # Fix AI Provider References and Progress Calculations

  1. Fixes
    - Ensures AIProviderId column exists before references
    - Adds missing foreign key constraints with proper checks
    - Updates existing projects to use AI provider
  
  2. Improvements
    - Adds proper error handling in stored procedures
    - Ensures progress calculations work correctly at all levels
    - Updates delivery notes counting for better accuracy
*/

-- Ensure AIProviderId column exists in Projects table
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Projects') AND name = 'AIProviderId'
)
BEGIN
    -- Add AIProviderId column to Projects table
    ALTER TABLE Projects
    ADD AIProviderId uniqueidentifier NULL;
END

-- Ensure AIProviders table exists
IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'AIProviders'
)
BEGIN
    -- Create AIProviders table
    CREATE TABLE AIProviders (
        Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        Name nvarchar(50) NOT NULL,
        ApiKey nvarchar(255) NOT NULL,
        Model nvarchar(100) NOT NULL,
        Endpoint nvarchar(255) NULL,
        Version nvarchar(50) NULL,
        IsDefault bit NOT NULL DEFAULT 0,
        CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt datetime2 NOT NULL DEFAULT GETDATE()
    );

    -- Add indexes for AIProviders
    CREATE INDEX IX_AIProviders_Name ON AIProviders(Name);
    CREATE INDEX IX_AIProviders_IsDefault ON AIProviders(IsDefault);

    -- Insert default AI providers
    DECLARE @MistralId uniqueidentifier = NEWID();
    DECLARE @OpenAIId uniqueidentifier = NEWID();
    DECLARE @AzureOpenAIId uniqueidentifier = NEWID();

    INSERT INTO AIProviders (Id, Name, ApiKey, Model, IsDefault)
    VALUES (@MistralId, 'MistralAI', 'your_mistral_api_key_here', 'mistral-large-latest', 1);

    INSERT INTO AIProviders (Id, Name, ApiKey, Model)
    VALUES (@OpenAIId, 'OpenAI', 'your_openai_api_key_here', 'gpt-4-vision-preview');

    INSERT INTO AIProviders (Id, Name, ApiKey, Model, Endpoint, Version)
    VALUES (@AzureOpenAIId, 'AzureOpenAI', 'your_azure_openai_api_key_here', 'gpt-4-vision', 'https://your-resource-name.openai.azure.com', '2023-05-15');
END

-- Update OcrMethod column for any projects that have the old 'mistral' value
UPDATE Projects
SET OcrMethod = 'ai'
WHERE OcrMethod = 'mistral';

-- Check if the FK constraint exists, and if not, create it
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Projects_AIProviders'
) AND EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Projects') AND name = 'AIProviderId'
)
BEGIN
    -- Add foreign key constraint
    ALTER TABLE Projects
    ADD CONSTRAINT FK_Projects_AIProviders FOREIGN KEY (AIProviderId) REFERENCES AIProviders(Id);
END

-- Create index for AIProviderId if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Projects_AIProviderId' AND object_id = OBJECT_ID('Projects')
) AND EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Projects') AND name = 'AIProviderId'
)
BEGIN
    CREATE INDEX IX_Projects_AIProviderId ON Projects(AIProviderId);
END

-- Update existing projects to use default AI provider if not set
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Projects') AND name = 'AIProviderId'
)
BEGIN
    UPDATE p
    SET p.AIProviderId = (SELECT TOP 1 Id FROM AIProviders WHERE IsDefault = 1)
    FROM Projects p
    WHERE p.AIProviderId IS NULL;
END

-- Update or create sp_GetAIProviderDetails
IF EXISTS (
    SELECT 1
    FROM sys.procedures
    WHERE name = 'sp_GetAIProviderDetails'
)
BEGIN
    DROP PROCEDURE sp_GetAIProviderDetails;
END

GO
CREATE PROCEDURE sp_GetAIProviderDetails
    @ProjectId uniqueidentifier = NULL,
    @ProviderName nvarchar(50) = NULL
AS
BEGIN
    -- Error handling
    BEGIN TRY
        -- Check if AIProviderId column exists before querying it
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
            -- Return default Mistral provider if column doesn't exist
            SELECT TOP 1 *
            FROM AIProviders
            WHERE Name = 'MistralAI'
            ORDER BY CreatedAt DESC;
        END
    END TRY
    BEGIN CATCH
        -- In case of any error, return the default provider
        SELECT TOP 1 *
        FROM AIProviders
        WHERE IsDefault = 1
        ORDER BY CreatedAt DESC;
    END CATCH
END

-- Update or create sp_UpdateProgress for accurate progress tracking
IF EXISTS (
    SELECT 1
    FROM sys.procedures
    WHERE name = 'sp_UpdateProgress'
)
BEGIN
    DROP PROCEDURE sp_UpdateProgress;
END

GO
CREATE PROCEDURE sp_UpdateProgress
  @DeliveryNoteId uniqueidentifier
AS
BEGIN
  -- Error handling
  BEGIN TRY
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

-- Make sure DeliveryNotes always has the correct status
GO
CREATE OR ALTER TRIGGER tr_DeliveryNotes_SetStatus
ON DeliveryNotes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if the Progress column was updated
    IF UPDATE(Progress) OR UPDATE(VerifiedEquipment)
    BEGIN
        -- Set the status based on the progress
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