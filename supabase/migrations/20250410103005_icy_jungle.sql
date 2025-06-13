/*
  # Initial Database Schema

  1. Tables
    - Projects
      - Main project information
      - Tracks delivery dates, status, and progress
    - Orders
      - Project orders containing delivery notes
      - Tracks estimated equipment and progress
    - DeliveryNotes
      - Individual delivery notes with equipment
      - Tracks verification status and attachments
    - Equipments
      - Individual equipment items
      - Tracks verification and matching status
    - EstimatedEquipments
      - Expected equipment for projects
      - Used for matching delivered equipment
    - DeviceNames
      - Tracks device name sequences
      - Used for generating unique device names

  2. Stored Procedures
    - Added procedures for creating records
    - Includes automatic ID generation
    - Handles related data updates

  3. Indexes
    - Added indexes for foreign keys
    - Added indexes for commonly queried fields
    - Added indexes for status and progress tracking
*/

-- Create Projects table
CREATE TABLE Projects (
  Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  DeliveryDate datetime2 NOT NULL,
  Datacenter nvarchar(50) NOT NULL,
  ProjectName nvarchar(200) NOT NULL,
  Client nvarchar(200) NOT NULL,
  RitmCode nvarchar(50) NOT NULL,
  ProjectCode nvarchar(200) NOT NULL,
  EstimatedEquipment int NOT NULL DEFAULT 0,
  Status nvarchar(50) NOT NULL DEFAULT 'Pendiente',
  Progress int NOT NULL DEFAULT 0,
  TeamsUrl nvarchar(500) NULL,
  ExcelPath nvarchar(500) NULL,
  OcrMethod nvarchar(50) NOT NULL DEFAULT 'mistral',
  CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt datetime2 NOT NULL DEFAULT GETDATE()
);

-- Create Orders table
CREATE TABLE Orders (
  Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  ProjectId uniqueidentifier NOT NULL,
  Code nvarchar(50) NOT NULL,
  EstimatedEquipment int NOT NULL DEFAULT 0,
  Progress int NOT NULL DEFAULT 0,
  CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_Orders_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- Create DeliveryNotes table
CREATE TABLE DeliveryNotes (
  Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  OrderId uniqueidentifier NOT NULL,
  Code nvarchar(50) NOT NULL,
  EstimatedEquipment int NOT NULL DEFAULT 0,
  DeliveredEquipment int NOT NULL DEFAULT 0,
  VerifiedEquipment int NOT NULL DEFAULT 0,
  Status nvarchar(50) NOT NULL DEFAULT 'Pendiente',
  Progress int NOT NULL DEFAULT 0,
  AttachmentPath nvarchar(500) NULL,
  AttachmentType nvarchar(50) NULL,
  CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_DeliveryNotes_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id)
);

-- Create EstimatedEquipments table
CREATE TABLE EstimatedEquipments (
  Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  ProjectId uniqueidentifier NOT NULL,
  Type nvarchar(100) NOT NULL,
  Model nvarchar(200) NOT NULL,
  Quantity int NOT NULL DEFAULT 0,
  CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_EstimatedEquipments_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- Create Equipments table
CREATE TABLE Equipments (
  Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  DeliveryNoteId uniqueidentifier NOT NULL,
  Name nvarchar(200) NOT NULL,
  SerialNumber nvarchar(100) NULL,
  PartNumber nvarchar(100) NULL,
  DeviceName nvarchar(100) NULL,
  Type nvarchar(100) NOT NULL,
  Model nvarchar(200) NOT NULL,
  IsVerified bit NOT NULL DEFAULT 0,
  PhotoPath nvarchar(500) NULL,
  IsMatched bit NOT NULL DEFAULT 0,
  MatchedWithId uniqueidentifier NULL,
  EstimatedEquipmentId uniqueidentifier NULL,
  CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_Equipments_DeliveryNotes FOREIGN KEY (DeliveryNoteId) REFERENCES DeliveryNotes(Id),
  CONSTRAINT FK_Equipments_EstimatedEquipments FOREIGN KEY (EstimatedEquipmentId) REFERENCES EstimatedEquipments(Id)
);

-- Create DeviceNames table
CREATE TABLE DeviceNames (
  Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  Prefix nvarchar(10) NOT NULL,
  Datacenter nvarchar(50) NOT NULL,
  LastNumber int NOT NULL DEFAULT 1000,
  CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt datetime2 NOT NULL DEFAULT GETDATE()
);

-- Create indexes
CREATE INDEX IX_Projects_Status ON Projects(Status);
CREATE INDEX IX_Projects_Progress ON Projects(Progress);
CREATE INDEX IX_Projects_Datacenter ON Projects(Datacenter);
CREATE INDEX IX_Projects_Client ON Projects(Client);

CREATE INDEX IX_Orders_ProjectId ON Orders(ProjectId);
CREATE INDEX IX_Orders_Progress ON Orders(Progress);

CREATE INDEX IX_DeliveryNotes_OrderId ON DeliveryNotes(OrderId);
CREATE INDEX IX_DeliveryNotes_Status ON DeliveryNotes(Status);
CREATE INDEX IX_DeliveryNotes_Progress ON DeliveryNotes(Progress);

CREATE INDEX IX_Equipments_DeliveryNoteId ON Equipments(DeliveryNoteId);
CREATE INDEX IX_Equipments_EstimatedEquipmentId ON Equipments(EstimatedEquipmentId);
CREATE INDEX IX_Equipments_IsVerified ON Equipments(IsVerified);
CREATE INDEX IX_Equipments_IsMatched ON Equipments(IsMatched);
CREATE INDEX IX_Equipments_SerialNumber ON Equipments(SerialNumber);
CREATE INDEX IX_Equipments_DeviceName ON Equipments(DeviceName);

CREATE INDEX IX_EstimatedEquipments_ProjectId ON EstimatedEquipments(ProjectId);
CREATE INDEX IX_EstimatedEquipments_Type ON EstimatedEquipments(Type);
CREATE INDEX IX_EstimatedEquipments_Model ON EstimatedEquipments(Model);

CREATE INDEX IX_DeviceNames_Prefix_Datacenter ON DeviceNames(Prefix, Datacenter);

-- Create stored procedures
GO
CREATE PROCEDURE sp_CreateProject
  @DeliveryDate datetime2,
  @Datacenter nvarchar(50),
  @ProjectName nvarchar(200),
  @Client nvarchar(200),
  @RitmCode nvarchar(50),
  @ProjectCode nvarchar(200),
  @EstimatedEquipment int,
  @Status nvarchar(50),
  @Progress int,
  @TeamsUrl nvarchar(500),
  @ExcelPath nvarchar(500),
  @OcrMethod nvarchar(50)
AS
BEGIN
  DECLARE @Id uniqueidentifier = NEWID()
  
  INSERT INTO Projects (
    Id, DeliveryDate, Datacenter, ProjectName, Client, RitmCode, ProjectCode,
    EstimatedEquipment, Status, Progress, TeamsUrl, ExcelPath, OcrMethod
  )
  VALUES (
    @Id, @DeliveryDate, @Datacenter, @ProjectName, @Client, @RitmCode, @ProjectCode,
    @EstimatedEquipment, @Status, @Progress, @TeamsUrl, @ExcelPath, @OcrMethod
  )
  
  SELECT @Id as Id
END
GO

CREATE PROCEDURE sp_CreateOrder
  @ProjectId uniqueidentifier,
  @Code nvarchar(50),
  @EstimatedEquipment int
AS
BEGIN
  DECLARE @Id uniqueidentifier = NEWID()
  
  INSERT INTO Orders (Id, ProjectId, Code, EstimatedEquipment)
  VALUES (@Id, @ProjectId, @Code, @EstimatedEquipment)
  
  SELECT @Id as Id
END
GO

CREATE PROCEDURE sp_CreateDeliveryNote
  @OrderId uniqueidentifier,
  @Code nvarchar(50),
  @EstimatedEquipment int,
  @Status nvarchar(50),
  @AttachmentPath nvarchar(500),
  @AttachmentType nvarchar(50)
AS
BEGIN
  DECLARE @Id uniqueidentifier = NEWID()
  
  INSERT INTO DeliveryNotes (
    Id, OrderId, Code, EstimatedEquipment, Status, 
    AttachmentPath, AttachmentType
  )
  VALUES (
    @Id, @OrderId, @Code, @EstimatedEquipment, @Status,
    @AttachmentPath, @AttachmentType
  )
  
  SELECT @Id as Id
END
GO

CREATE PROCEDURE sp_CreateEquipment
  @DeliveryNoteId uniqueidentifier,
  @Name nvarchar(200),
  @SerialNumber nvarchar(100),
  @PartNumber nvarchar(100),
  @DeviceName nvarchar(100),
  @Type nvarchar(100),
  @Model nvarchar(200),
  @PhotoPath nvarchar(500)
AS
BEGIN
  DECLARE @Id uniqueidentifier = NEWID()
  
  INSERT INTO Equipments (
    Id, DeliveryNoteId, Name, SerialNumber, PartNumber,
    DeviceName, Type, Model, PhotoPath
  )
  VALUES (
    @Id, @DeliveryNoteId, @Name, @SerialNumber, @PartNumber,
    @DeviceName, @Type, @Model, @PhotoPath
  )
  
  -- Update DeliveryNote counts
  UPDATE DeliveryNotes
  SET DeliveredEquipment = (
    SELECT COUNT(*) 
    FROM Equipments 
    WHERE DeliveryNoteId = @DeliveryNoteId
  )
  WHERE Id = @DeliveryNoteId
  
  SELECT @Id as Id
END
GO

CREATE PROCEDURE sp_CreateEstimatedEquipment
  @ProjectId uniqueidentifier,
  @Type nvarchar(100),
  @Model nvarchar(200),
  @Quantity int
AS
BEGIN
  DECLARE @Id uniqueidentifier = NEWID()
  
  INSERT INTO EstimatedEquipments (Id, ProjectId, Type, Model, Quantity)
  VALUES (@Id, @ProjectId, @Type, @Model, @Quantity)
  
  -- Update Project estimated equipment count
  UPDATE Projects
  SET EstimatedEquipment = (
    SELECT SUM(Quantity)
    FROM EstimatedEquipments
    WHERE ProjectId = @ProjectId
  )
  WHERE Id = @ProjectId
  
  SELECT @Id as Id
END