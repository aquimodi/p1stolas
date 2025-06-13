import { executeQuery, executeStoredProcedure } from './dbService';
import { User, UserGroup, Permission } from '../types';

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const query = `
    SELECT 
      u.*,
      ug.Name as UserGroupName,
      ug.Description as UserGroupDescription
    FROM Users u
    LEFT JOIN UserGroups ug ON ug.Id = u.UserGroupId
    WHERE u.Email = @param0 AND u.IsActive = 1
  `;
  
  const results = await executeQuery<User>(query, [email]);
  return results.length > 0 ? results[0] : null;
};

export const validateUserPassword = async (
  email: string, 
  password: string
): Promise<User | null> => {
  const query = `
    SELECT 
      u.*,
      ug.Name as UserGroupName,
      ug.Description as UserGroupDescription
    FROM Users u
    LEFT JOIN UserGroups ug ON ug.Id = u.UserGroupId
    WHERE u.Email = @param0 
      AND u.PasswordHash = CONVERT(nvarchar(255), HASHBYTES('SHA2_256', @param1), 2)
      AND u.IsActive = 1
  `;
  
  const results = await executeQuery<User>(query, [email, password]);
  return results.length > 0 ? results[0] : null;
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  const query = `
    UPDATE Users
    SET 
      LastLogin = GETDATE(),
      UpdatedAt = GETDATE()
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [userId]);
};

export const getUserGroups = async (): Promise<UserGroup[]> => {
  const query = `
    SELECT 
      ug.*,
      (SELECT COUNT(*) FROM Users u WHERE u.UserGroupId = ug.Id) as MemberCount,
      (
        SELECT STRING_AGG(p.Name, ',')
        FROM UserGroupPermissions ugp
        JOIN Permissions p ON p.Id = ugp.PermissionId
        WHERE ugp.UserGroupId = ug.Id
      ) as Permissions
    FROM UserGroups ug
    ORDER BY ug.Name
  `;
  
  return executeQuery<UserGroup>(query);
};

export const getUserGroupPermissions = async (groupId: string): Promise<Permission[]> => {
  const query = `
    SELECT p.*
    FROM Permissions p
    JOIN UserGroupPermissions ugp ON ugp.PermissionId = p.Id
    WHERE ugp.UserGroupId = @param0
    ORDER BY p.Resource, p.Action
  `;
  
  return executeQuery<Permission>(query, [groupId]);
};

export const createUser = async (user: Omit<User, 'id'>): Promise<string> => {
  const result = await executeStoredProcedure<{ Id: string }>('sp_CreateUser', {
    Name: user.name,
    Email: user.email,
    Password: user.passwordHash, // Will be hashed in the stored procedure
    Avatar: user.avatar,
    Role: user.role,
    Department: user.department,
    Location: user.location,
    UserGroupId: user.userGroupId
  });
  
  return result[0].Id;
};

export const updateUser = async (
  userId: string, 
  user: Partial<User>
): Promise<void> => {
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
    userId,
    user.name,
    user.email,
    user.avatar,
    user.role,
    user.department,
    user.location,
    user.userGroupId
  ]);
};

export const deactivateUser = async (userId: string): Promise<void> => {
  const query = `
    UPDATE Users
    SET 
      IsActive = 0,
      UpdatedAt = GETDATE()
    WHERE Id = @param0
  `;
  
  await executeQuery(query, [userId]);
};

export const getUsers = async (): Promise<User[]> => {
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
  
  return executeQuery<User>(query);
};