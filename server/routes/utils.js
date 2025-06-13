import express from 'express';
import { 
  analyzeDocument, 
  generateDeviceName, 
  exportToExcel,
  getAppSettings,
  updateSettings
} from '../controllers/utilsController.js';

const router = express.Router();

// Analyze document using OCR
router.post('/analyze-document', analyzeDocument);

// Generate a device name
router.get('/generate-device-name', generateDeviceName);

// Export data to Excel
router.post('/export-excel', exportToExcel);

// Get settings
router.get('/settings', getAppSettings);

// Update settings
router.put('/settings', updateSettings);

export default router;