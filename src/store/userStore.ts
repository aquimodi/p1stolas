import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserGroup, UserRole, Permission } from '../types';
import { generateUniqueId } from '../utils/helpers';

interface UserState {
  currentUser: User | null;
  users: User[];
  userGroups: UserGroup[];
  
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => string;
  updateUser: (userId: string, userData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  
  addUserGroup: (groupData: Omit<UserGroup, 'id'>) => string;
  updateUserGroup: (groupId: string, groupData: Partial<UserGroup>) => void;
  deleteUserGroup: (groupId: string) => void;
  
  assignUserToGroup: (userId: string, groupId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      userGroups: [],
      
      login: async (email, password) => {
        // In a real app, this would validate credentials against a backend
        const user = get().users.find(u => u.email === email && u.isActive);
        
        if (user) {
          // Update last login time
          const updatedUser = { ...user, lastLogin: new Date().toISOString() };
          set(state => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === user.id ? updatedUser : u)
          }));
          return updatedUser;
        }
        
        return null;
      },
      
      logout: () => {
        set({ currentUser: null });
      },
      
      addUser: (userData) => {
        const id = generateUniqueId();
        const newUser: User = {
          id,
          ...userData
        };
        
        set(state => ({
          users: [...state.users, newUser],
          userGroups: state.userGroups.map(group => 
            group.id === userData.userGroupId
              ? { ...group, memberCount: group.memberCount + 1 }
              : group
          )
        }));
        
        return id;
      },
      
      updateUser: (userId, userData) => {
        set(state => {
          const user = state.users.find(u => u.id === userId);
          
          // If the user group changed, update the member counts
          if (user && userData.userGroupId && userData.userGroupId !== user.userGroupId) {
            const updatedGroups = state.userGroups.map(group => {
              if (group.id === user.userGroupId) {
                return { ...group, memberCount: Math.max(0, group.memberCount - 1) };
              }
              if (group.id === userData.userGroupId) {
                return { ...group, memberCount: group.memberCount + 1 };
              }
              return group;
            });
            
            return {
              users: state.users.map(u => u.id === userId ? { ...u, ...userData } : u),
              userGroups: updatedGroups,
              currentUser: state.currentUser?.id === userId 
                ? { ...state.currentUser, ...userData }
                : state.currentUser
            };
          }
          
          // Just update the user without changing group membership
          return {
            users: state.users.map(u => u.id === userId ? { ...u, ...userData } : u),
            currentUser: state.currentUser?.id === userId 
              ? { ...state.currentUser, ...userData }
              : state.currentUser
          };
        });
      },
      
      deleteUser: (userId) => {
        set(state => {
          const user = state.users.find(u => u.id === userId);
          
          if (user) {
            // Update group member count
            const updatedGroups = state.userGroups.map(group => 
              group.id === user.userGroupId
                ? { ...group, memberCount: Math.max(0, group.memberCount - 1) }
                : group
            );
            
            return {
              users: state.users.filter(u => u.id !== userId),
              userGroups: updatedGroups
            };
          }
          
          return state;
        });
      },
      
      addUserGroup: (groupData) => {
        const id = generateUniqueId();
        const newGroup: UserGroup = {
          id,
          ...groupData
        };
        
        set(state => ({
          userGroups: [...state.userGroups, newGroup]
        }));
        
        return id;
      },
      
      updateUserGroup: (groupId, groupData) => {
        set(state => ({
          userGroups: state.userGroups.map(g => 
            g.id === groupId ? { ...g, ...groupData } : g
          )
        }));
      },
      
      deleteUserGroup: (groupId) => {
        set(state => ({
          userGroups: state.userGroups.filter(g => g.id !== groupId)
        }));
      },
      
      assignUserToGroup: (userId, groupId) => {
        set(state => {
          const user = state.users.find(u => u.id === userId);
          
          if (user && user.userGroupId !== groupId) {
            // Update user's group
            const updatedUsers = state.users.map(u => 
              u.id === userId ? { ...u, userGroupId: groupId } : u
            );
            
            // Update group member counts
            const updatedGroups = state.userGroups.map(group => {
              if (group.id === user.userGroupId) {
                return { ...group, memberCount: Math.max(0, group.memberCount - 1) };
              }
              if (group.id === groupId) {
                return { ...group, memberCount: group.memberCount + 1 };
              }
              return group;
            });
            
            return {
              users: updatedUsers,
              userGroups: updatedGroups,
              currentUser: state.currentUser?.id === userId 
                ? { ...state.currentUser, userGroupId: groupId }
                : state.currentUser
            };
          }
          
          return state;
        });
      }
    }),
    {
      name: 'datacenter-app-users'
    }
  )
);