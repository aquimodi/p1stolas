import { logger } from '../utils/logger.js';
import { executeQuery, executeStoredProcedure } from '../utils/dbConnector.js';
import { getSettings } from '../utils/settings.js';
import { sampleUsers } from '../data/sampleData.js';
import { generateUniqueId } from '../utils/helpers.js';

// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return sample users in demo mode
      return res.json(sampleUsers);
    }
    
    const query = `
      SELECT 
        u.*,
        ug.Name as UserGroupName,
        ug.Description as UserGroupDescription
      FROM Users u
      LEFT JOIN UserGroups ug ON ug.Id = u.UserGroupId
      WHERE u.IsActive = 1
      ORDER BY u.Name
    `;
    
    const users = await executeQuery(query);
    
    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { PasswordHash, ...sanitizedUser } = user;
      return sanitizedUser;
    });
    
    res.json(sanitizedUsers);
  } catch (error) {
    next(error);
  }
};

// Get a specific user by ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Find user in sample data
      const user = sampleUsers.find(u => u.id === id);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Remove sensitive data
      const { passwordHash, ...sanitizedUser } = user;
      
      return res.json(sanitizedUser);
    }
    
    const query = `
      SELECT 
        u.*,
        ug.Name as UserGroupName,
        ug.Description as UserGroupDescription
      FROM Users u
      LEFT JOIN UserGroups ug ON ug.Id = u.UserGroupId
      WHERE u.Id = @param0 AND u.IsActive = 1
    `;
    
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Remove sensitive data
    const { PasswordHash, ...sanitizedUser } = results[0];
    
    res.json(sanitizedUser);
  } catch (error) {
    next(error);
  }
};

// Create a new user
export const createUser = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    const user = req.body;
    
    if (!user.name || !user.email) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requieren name y email' 
      });
    }
    
    if (!user.password) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere password' 
      });
    }
    
    if (demoMode) {
      // Return success in demo mode with a fake ID
      return res.status(201).json({ 
        id: `user-${Date.now()}`,
        name: user.name,
        email: user.email,
        avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg',
        role: user.role || 'viewer',
        department: user.department || '',
        location: user.location || '',
        userGroupId: user.userGroupId || null,
        lastLogin: null,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }
    
    // Check if email is already in use
    const checkQuery = `SELECT Id FROM Users WHERE Email = @param0`;
    const checkResults = await executeQuery(checkQuery, [user.email]);
    
    if (checkResults.length > 0) {
      return res.status(400).json({ 
        error: true, 
        message: 'El email ya está en uso' 
      });
    }
    
    const result = await executeStoredProcedure('sp_CreateUser', {
      Name: user.name,
      Email: user.email,
      Password: user.password,
      Avatar: user.avatar || null,
      Role: user.role || 'viewer',
      Department: user.department || null,
      Location: user.location || null,
      UserGroupId: user.userGroupId || null
    });
    
    res.status(201).json({
      id: result[0].Id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg',
      role: user.role || 'viewer',
      department: user.department || '',
      location: user.location || '',
      userGroupId: user.userGroupId || null,
      lastLogin: null,
      isActive: true,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Update a user
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const updates = req.body;
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({
        id,
        ...updates
      });
    }
    
    // If password is included, it needs to be hashed
    if (updates.password) {
      const updatePasswordQuery = `
        UPDATE Users
        SET 
          PasswordHash = CONVERT(nvarchar(255), HASHBYTES('SHA2_256', @param1), 2),
          UpdatedAt = GETDATE()
        WHERE Id = @param0
      `;
      
      await executeQuery(updatePasswordQuery, [id, updates.password]);
      
      // Remove password so it's not included in the main update
      delete updates.password;
    }
    
    // Only proceed with main update if there are fields to update
    if (Object.keys(updates).length > 0) {
      const query = `
        UPDATE Users
        SET 
          Name = COALESCE(@param1, Name),
          Email = COALESCE(@param2, Email),
          Avatar = COALESCE(@param3, Avatar),
          Role = COALESCE(@param4, Role),
          Department = COALESCE(@param5, Department),
          Location = COALESCE(@param6, Location),
          UserGroupId = COALESCE(@param7, UserGroupId),
          UpdatedAt = GETDATE()
        WHERE Id = @param0
      `;
      
      await executeQuery(query, [
        id,
        updates.name,
        updates.email,
        updates.avatar,
        updates.role,
        updates.department,
        updates.location,
        updates.userGroupId
      ]);
    }
    
    res.json({
      id,
      ...updates
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user (soft delete)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ message: 'Usuario desactivado correctamente' });
    }
    
    // Soft delete - set IsActive to 0
    const query = `
      UPDATE Users
      SET 
        IsActive = 0,
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [id]);
    
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Get all user groups
export const getUserGroups = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return sample data in demo mode
      return res.json([
        {
          id: 'group1',
          name: 'Administradores',
          description: 'Acceso completo al sistema',
          permissions: Array(7).fill().map((_, i) => ({ id: `perm${i+1}`, name: `Permission ${i+1}` })),
          memberCount: 1,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'group2',
          name: 'Técnicos de Datacenter',
          description: 'Gestión de equipos y albaranes',
          permissions: Array(5).fill().map((_, i) => ({ id: `perm${i+1}`, name: `Permission ${i+1}` })),
          memberCount: 2,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'group3',
          name: 'Supervisores',
          description: 'Supervisión de proyectos e incidencias',
          permissions: Array(3).fill().map((_, i) => ({ id: `perm${i+1}`, name: `Permission ${i+1}` })),
          memberCount: 1,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'group4',
          name: 'Visualizadores',
          description: 'Solo lectura',
          permissions: Array(2).fill().map((_, i) => ({ id: `perm${i+1}`, name: `Permission ${i+1}` })),
          memberCount: 0,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    }
    
    const query = `
      SELECT 
        ug.*,
        (SELECT COUNT(*) FROM Users u WHERE u.UserGroupId = ug.Id AND u.IsActive = 1) as MemberCount
      FROM UserGroups ug
      ORDER BY ug.Name
    `;
    
    const groups = await executeQuery(query);
    
    // For each group, get its permissions
    for (const group of groups) {
      const permissionQuery = `
        SELECT p.*
        FROM Permissions p
        JOIN UserGroupPermissions ugp ON p.Id = ugp.PermissionId
        WHERE ugp.UserGroupId = @param0
        ORDER BY p.Resource, p.Action
      `;
      
      group.permissions = await executeQuery(permissionQuery, [group.Id]);
    }
    
    res.json(groups);
  } catch (error) {
    next(error);
  }
};

// Add a new user group
export const addUserGroup = async (req, res, next) => {
  try {
    const { demoMode } = getSettings();
    const group = req.body;
    
    if (!group.name) {
      return res.status(400).json({ 
        error: true, 
        message: 'Se requiere name' 
      });
    }
    
    if (demoMode) {
      // Return success in demo mode with a fake ID
      return res.status(201).json({ 
        id: `group-${Date.now()}`,
        name: group.name,
        description: group.description || '',
        permissions: group.permissions || [],
        memberCount: 0,
        createdAt: new Date().toISOString()
      });
    }
    
    // Insert group
    const groupId = generateUniqueId();
    const query = `
      INSERT INTO UserGroups (Id, Name, Description)
      VALUES (@param0, @param1, @param2)
    `;
    
    await executeQuery(query, [
      groupId,
      group.name,
      group.description || null
    ]);
    
    // Add permissions if provided
    if (group.permissions && Array.isArray(group.permissions) && group.permissions.length > 0) {
      for (const permission of group.permissions) {
        const permissionQuery = `
          INSERT INTO UserGroupPermissions (UserGroupId, PermissionId)
          VALUES (@param0, @param1)
        `;
        
        await executeQuery(permissionQuery, [
          groupId,
          permission.id
        ]);
      }
    }
    
    res.status(201).json({
      id: groupId,
      name: group.name,
      description: group.description || '',
      permissions: group.permissions || [],
      memberCount: 0,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Update a user group
export const updateUserGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    const updates = req.body;
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({
        id,
        ...updates
      });
    }
    
    // Update group
    const query = `
      UPDATE UserGroups
      SET 
        Name = COALESCE(@param1, Name),
        Description = COALESCE(@param2, Description),
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [
      id,
      updates.name,
      updates.description
    ]);
    
    // If permissions are provided, update them
    if (updates.permissions && Array.isArray(updates.permissions)) {
      // First, remove all existing permissions
      const deleteQuery = `DELETE FROM UserGroupPermissions WHERE UserGroupId = @param0`;
      await executeQuery(deleteQuery, [id]);
      
      // Then, add the new ones
      for (const permission of updates.permissions) {
        const permissionQuery = `
          INSERT INTO UserGroupPermissions (UserGroupId, PermissionId)
          VALUES (@param0, @param1)
        `;
        
        await executeQuery(permissionQuery, [
          id,
          permission.id
        ]);
      }
    }
    
    res.json({
      id,
      ...updates
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user group
export const deleteUserGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ message: 'Grupo de usuarios eliminado correctamente' });
    }
    
    // First, remove all permissions
    const deletePermsQuery = `DELETE FROM UserGroupPermissions WHERE UserGroupId = @param0`;
    await executeQuery(deletePermsQuery, [id]);
    
    // Remove group ID from users
    const updateUsersQuery = `
      UPDATE Users
      SET 
        UserGroupId = NULL,
        UpdatedAt = GETDATE()
      WHERE UserGroupId = @param0
    `;
    
    await executeQuery(updateUsersQuery, [id]);
    
    // Delete the group
    const query = `DELETE FROM UserGroups WHERE Id = @param0`;
    await executeQuery(query, [id]);
    
    res.json({ message: 'Grupo de usuarios eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Assign user to group
export const assignUserToGroup = async (req, res, next) => {
  try {
    const { id, groupId } = req.params;
    const { demoMode } = getSettings();
    
    if (demoMode) {
      // Return success in demo mode
      return res.json({ 
        message: 'Usuario asignado al grupo correctamente',
        userId: id,
        groupId
      });
    }
    
    // Update user
    const query = `
      UPDATE Users
      SET 
        UserGroupId = @param1,
        UpdatedAt = GETDATE()
      WHERE Id = @param0
    `;
    
    await executeQuery(query, [id, groupId]);
    
    res.json({ 
      message: 'Usuario asignado al grupo correctamente',
      userId: id,
      groupId
    });
  } catch (error) {
    next(error);
  }
};