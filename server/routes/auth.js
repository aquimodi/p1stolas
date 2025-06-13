import express from 'express';
import { 
  login,
  logout,
  refreshToken,
  getCurrentUser,
  resetPassword,
  changePassword
} from '../controllers/authController.js';

const router = express.Router();

// Login
router.post('/login', login);

// Logout
router.post('/logout', logout);

// Refresh token
router.post('/refresh-token', refreshToken);

// Get current user
router.get('/me', getCurrentUser);

// Request password reset
router.post('/reset-password', resetPassword);

// Change password (with token)
router.post('/change-password', changePassword);

export default router;