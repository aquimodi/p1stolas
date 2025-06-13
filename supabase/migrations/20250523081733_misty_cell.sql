/*
  # Fix AI Provider Reference

  1. Purpose
    - Fix the reference to AIProviderId column
    - Ensure column exists before updating it
    - Update existing projects with the default AI provider

  2. Changes
    - Add safety check to create AIProviderId if missing
    - Update table structures in correct order to avoid foreign key issues
*/

-- Check if AIProviderId column exists in Projects table and add it if missing
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Projects') AND name = 'AIProviderId'
)
BEGIN
    -- Add AIProviderId column to Projects table
    ALTER TABLE Projects
    ADD AIProviderId uniqueidentifier NULL;

    -- Add index for foreign key (will be created later if needed)
    CREATE INDEX IX_Projects_AIProviderId ON Projects(AIProviderId);
END

-- Check if AIProviders table exists and create it if missing
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

    -- Insert default AI providers if they don't exist
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

-- Check if foreign key constraint exists and create it if missing
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Projects_AIProviders'
)
BEGIN
    -- Add foreign key constraint
    ALTER TABLE Projects
    ADD CONSTRAINT FK_Projects_AIProviders FOREIGN KEY (AIProviderId) REFERENCES AIProviders(Id);
END

-- Update existing projects to use default AI provider if not set
UPDATE p
SET p.AIProviderId = (SELECT TOP 1 Id FROM AIProviders WHERE IsDefault = 1),
    p.OcrMethod = 'ai'  -- Update existing OCR method to new generic value
FROM Projects p
WHERE p.AIProviderId IS NULL;

-- Make sure sp_GetAIProviderDetails exists
IF NOT EXISTS (
    SELECT 1
    FROM sys.procedures
    WHERE name = 'sp_GetAIProviderDetails'
)
BEGIN
    EXEC('
    CREATE PROCEDURE sp_GetAIProviderDetails
        @ProjectId uniqueidentifier = NULL,
        @ProviderName nvarchar(50) = NULL
    AS
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
    ');
END

-- Make sure sp_UpdateProgress exists
IF NOT EXISTS (
    SELECT 1
    FROM sys.procedures
    WHERE name = 'sp_UpdateProgress'
)
BEGIN
    EXEC('
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
    ');
END