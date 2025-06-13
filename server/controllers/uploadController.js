import { logger } from '../utils/logger.js';
import { formatFileSize } from '../utils/helpers.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory
const uploadsDir = path.join(__dirname, '../../uploads');

// Upload a file
export const uploadFile = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: true, 
        message: 'No se ha subido ningún archivo' 
      });
    }
    
    // Get file details
    const { filename, originalname, mimetype, size } = req.file;
    
    logger.info(`File uploaded: ${originalname}`, {
      filename,
      mimetype,
      size: formatFileSize(size)
    });
    
    // Return file information
    res.status(201).json({
      filename,
      originalname,
      mimetype,
      size: formatFileSize(size),
      url: `/uploads/${filename}`
    });
  } catch (error) {
    next(error);
  }
};

// Get a file
export const getFile = (req, res, next) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        error: true, 
        message: 'Archivo no encontrado' 
      });
    }
    
    // Send file
    res.sendFile(filepath);
  } catch (error) {
    next(error);
  }
};

// Delete a file
export const deleteFile = (req, res, next) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        error: true, 
        message: 'Archivo no encontrado' 
      });
    }
    
    // Delete file
    fs.unlinkSync(filepath);
    
    logger.info(`File deleted: ${filename}`);
    
    res.json({ message: 'Archivo eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};