import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { getSettings } from '../utils/settings.js';
import { sampleUsers } from '../data/sampleData.js';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'datacenter-app-secret-key';

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { demoMode } = getSettings();
    
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Se requiere email y password'
      });
    }
    
    // In demo mode, check against sample users
    if (demoMode) {
      const user = sampleUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && u.isActive
      );
      
      if (!user) {
        return res.status(401).json({
          error: true,
          message: 'Credenciales inválidas'
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      // Update last login
      const updatedUser = { 
        ...user, 
        lastLogin: new Date().toISOString() 
      };
      
      return res.json({
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar
        }
      });
    }
    
    // In real mode, this would validate against DB
    // For now, we'll implement a simplified version
    
    // Add your real authentication logic here
    
    res.status(500).json({ 
      error: true,
      message: 'Autenticación con base de datos real no implementada en esta versión'
    });
  } catch (error) {
    next(error);
  }
};

// Logout (just a formality, actual token invalidation would be handled client-side)
export const logout = (req, res) => {
  res.json({ message: 'Sesión cerrada correctamente' });
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: true,
        message: 'Token no proporcionado'
      });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Generate a new token
      const newToken = jwt.sign(
        { 
          id: decoded.id, 
          email: decoded.email, 
          role: decoded.role 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      res.json({ token: newToken });
    } catch (error) {
      logger.error('Error refreshing token:', error);
      res.status(401).json({
        error: true,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'No autorizado'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      const { demoMode } = getSettings();
      
      if (demoMode) {
        // Find user in sample data
        const user = sampleUsers.find(u => u.id === decoded.id);
        
        if (!user) {
          return res.status(404).json({
            error: true,
            message: 'Usuario no encontrado'
          });
        }
        
        return res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          department: user.department,
          location: user.location
        });
      }
      
      // In real mode, this would fetch the user from the database
      // Add your real user fetching logic here
      
      res.status(500).json({ 
        error: true,
        message: 'Obtención de usuario real no implementada en esta versión'
      });
    } catch (error) {
      logger.error('Error verifying token:', error);
      res.status(401).json({
        error: true,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Request password reset (simplified)
export const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: true,
        message: 'Se requiere email'
      });
    }
    
    // In a real app, this would:
    // 1. Check if the user exists
    // 2. Generate a reset token
    // 3. Send an email with a reset link
    
    // For now, just log it and return success
    logger.info(`Password reset requested for: ${email}`);
    
    res.json({ 
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });
  } catch (error) {
    next(error);
  }
};

// Change password (simplified)
export const changePassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        error: true,
        message: 'Se requieren token y newPassword'
      });
    }
    
    // In a real app, this would:
    // 1. Verify the reset token
    // 2. Update the user's password in the database
    
    // For now, just log it and return success
    logger.info('Password changed with token');
    
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};