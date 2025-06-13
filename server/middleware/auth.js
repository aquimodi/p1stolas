import jwt from 'jsonwebtoken';
import { getSettings } from '../utils/settings.js';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'datacenter-app-secret-key';

// Authentication middleware
export const authenticate = (req, res, next) => {
  try {
    // Get settings
    const { demoMode } = getSettings();
    
    // Skip authentication in demo mode
    if (demoMode) {
      return next();
    }
    
    // Check for auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'No autorizado'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Get settings
      const { demoMode } = getSettings();
      
      // Skip authorization in demo mode
      if (demoMode) {
        return next();
      }
      
      // Check if user exists in request
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: 'No autorizado'
        });
      }
      
      // Check if user role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: true,
          message: 'Acceso prohibido'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};