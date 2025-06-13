/*
  # Add User Management Tables

  1. New Tables
    - `Users`: Stores user information and authentication details
    - `UserGroups`: Defines groups with specific permissions
    - `Permissions`: Available system permissions
    - `UserGroupPermissions`: Many-to-many relationship between groups and permissions

  2. Security
    - Passwords are hashed using SHA2_256
    - Foreign key constraints ensure data integrity
    - Indexes optimize common queries

  3. Changes
    - Added stored procedures for user management
*/

-- Create Users table
CREATE TABLE Users (
    Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    Name nvarchar(200) NOT NULL,
    Email nvarchar(255) UNIQUE NOT NULL,
    PasswordHash nvarchar(255) NOT NULL,
    Avatar nvarchar(500) NULL,
    Role nvarchar(50) NOT NULL DEFAULT 'viewer',
    Department nvarchar(200) NULL,
    Location nvarchar(200) NULL,
    LastLogin datetime2 NULL,
    IsActive bit NOT NULL DEFAULT 1,
    UserGroupId uniqueidentifier NULL,
    CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt datetime2 NOT NULL DEFAULT GETDATE()
);

-- Create UserGroups table
CREATE TABLE UserGroups (
    Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    Name nvarchar(200) NOT NULL,
    Description nvarchar(500) NULL,
    CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt datetime2 NOT NULL DEFAULT GETDATE()
);

-- Create Permissions table
CREATE TABLE Permissions (
    Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    Name nvarchar(200) NOT NULL,
    Description nvarchar(500) NULL,
    Resource nvarchar(200) NOT NULL,
    Action nvarchar(50) NOT NULL,
    CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt datetime2 NOT NULL DEFAULT GETDATE()
);

-- Create UserGroupPermissions table (many-to-many)
CREATE TABLE UserGroupPermissions (
    UserGroupId uniqueidentifier NOT NULL,
    PermissionId uniqueidentifier NOT NULL,
    PRIMARY KEY (UserGroupId, PermissionId),
    CONSTRAINT FK_UserGroupPermissions_UserGroups FOREIGN KEY (UserGroupId) REFERENCES UserGroups(Id),
    CONSTRAINT FK_UserGroupPermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES Permissions(Id)
);

-- Add foreign key to Users table
ALTER TABLE Users
ADD CONSTRAINT FK_Users_UserGroups FOREIGN KEY (UserGroupId) REFERENCES UserGroups(Id);

-- Create indexes
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);
CREATE INDEX IX_Users_UserGroupId ON Users(UserGroupId);
CREATE INDEX IX_UserGroups_Name ON UserGroups(Name);
CREATE INDEX IX_Permissions_Name ON Permissions(Name);
CREATE INDEX IX_Permissions_Resource_Action ON Permissions(Resource, Action);

-- Create stored procedures
GO
CREATE PROCEDURE sp_CreateUser
    @Name nvarchar(200),
    @Email nvarchar(255),
    @Password nvarchar(255),
    @Avatar nvarchar(500) = NULL,
    @Role nvarchar(50) = 'viewer',
    @Department nvarchar(200) = NULL,
    @Location nvarchar(200) = NULL,
    @UserGroupId uniqueidentifier = NULL
AS
BEGIN
    -- Hash the password
    DECLARE @PasswordHash nvarchar(255) = CONVERT(nvarchar(255), HASHBYTES('SHA2_256', @Password), 2)
    DECLARE @Id uniqueidentifier = NEWID()

    INSERT INTO Users (
        Id, Name, Email, PasswordHash, Avatar, Role, 
        Department, Location, UserGroupId
    )
    VALUES (
        @Id, @Name, @Email, @PasswordHash, @Avatar, @Role,
        @Department, @Location, @UserGroupId
    )

    SELECT @Id as Id
END
GO

-- Insert default permissions
INSERT INTO Permissions (Id, Name, Description, Resource, Action) VALUES
    (NEWID(), 'projects.view', 'Ver proyectos', 'projects', 'read'),
    (NEWID(), 'projects.edit', 'Editar proyectos', 'projects', 'update'),
    (NEWID(), 'projects.create', 'Crear proyectos', 'projects', 'create'),
    (NEWID(), 'incidents.view', 'Ver incidencias', 'incidents', 'read'),
    (NEWID(), 'incidents.manage', 'Gestionar incidencias', 'incidents', 'manage'),
    (NEWID(), 'users.manage', 'Gestionar usuarios', 'users', 'manage'),
    (NEWID(), 'settings.manage', 'Gestionar ajustes', 'settings', 'manage');

-- Insert default user groups
DECLARE @AdminGroupId uniqueidentifier = NEWID()
DECLARE @TechGroupId uniqueidentifier = NEWID()
DECLARE @SupervisorGroupId uniqueidentifier = NEWID()
DECLARE @ViewerGroupId uniqueidentifier = NEWID()

INSERT INTO UserGroups (Id, Name, Description) VALUES
    (@AdminGroupId, 'Administradores', 'Acceso completo al sistema'),
    (@TechGroupId, 'Técnicos de Datacenter', 'Gestión de equipos y albaranes'),
    (@SupervisorGroupId, 'Supervisores', 'Supervisión de proyectos e incidencias'),
    (@ViewerGroupId, 'Visualizadores', 'Solo lectura');

-- Assign permissions to groups
INSERT INTO UserGroupPermissions (UserGroupId, PermissionId)
SELECT @AdminGroupId, Id FROM Permissions;

INSERT INTO UserGroupPermissions (UserGroupId, PermissionId)
SELECT @TechGroupId, Id FROM Permissions 
WHERE Resource != 'users' AND Resource != 'settings';

INSERT INTO UserGroupPermissions (UserGroupId, PermissionId)
SELECT @SupervisorGroupId, Id FROM Permissions 
WHERE Action = 'read' OR Name LIKE '%incidents%';

INSERT INTO UserGroupPermissions (UserGroupId, PermissionId)
SELECT @ViewerGroupId, Id FROM Permissions 
WHERE Action = 'read';

-- Insert default admin user
EXEC sp_CreateUser 
    @Name = 'Administrador del Sistema',
    @Email = 'admin@datacenter.com',
    @Password = 'Admin123!',
    @Avatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    @Role = 'admin',
    @Department = 'IT',
    @Location = 'Madrid',
    @UserGroupId = @AdminGroupId;