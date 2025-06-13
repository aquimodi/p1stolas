/*
  # Add AI Provider Support

  1. New Tables
    - `AIProviders`: Stores configuration for different AI providers (OpenAI, AzureOpenAI, MistralAI)
    - New fields added for endpoint, version, model, etc.

  2. Project Updates
    - Added reference to AI provider for each project
    - Updated OCR method field to be more generic

  3. Security & Constraints
    - Added foreign key constraints
    - Added indexes for efficient querying
*/

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

-- Alter Projects table to reference AIProvider
ALTER TABLE Projects
ADD AIProviderId uniqueidentifier NULL;

-- Add foreign key constraint
ALTER TABLE Projects
ADD CONSTRAINT FK_Projects_AIProviders FOREIGN KEY (AIProviderId) REFERENCES AIProviders(Id);

-- Add index for foreign key
CREATE INDEX IX_Projects_AIProviderId ON Projects(AIProviderId);

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

-- Update existing projects to use default AI provider
UPDATE p
SET p.AIProviderId = (SELECT TOP 1 Id FROM AIProviders WHERE IsDefault = 1),
    p.OcrMethod = 'ai'  -- Update existing OCR method to new generic value
FROM Projects p
WHERE p.AIProviderId IS NULL;

-- Add a stored procedure to get AI provider details
GO
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