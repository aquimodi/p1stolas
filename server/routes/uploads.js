import express from 'express';
import { uploadFile, getFile, deleteFile } from '../controllers/uploadController.js';

export default function(upload) {
  const router = express.Router();

  // Upload a file
  router.post('/', upload.single('file'), uploadFile);

  // Get a file
  router.get('/:filename', getFile);

  // Delete a file
  router.delete('/:filename', deleteFile);

  return router;
}