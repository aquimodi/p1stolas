import express from 'express';
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectEquipment
} from '../controllers/projectController.js';

const router = express.Router();

// Get all projects
router.get('/', getAllProjects);

// Get a specific project by ID
router.get('/:id', getProjectById);

// Create a new project
router.post('/', createProject);

// Update a project
router.put('/:id', updateProject);

// Delete a project
router.delete('/:id', deleteProject);

// Get all equipment for a project
router.get('/:id/equipment', getProjectEquipment);

export default router;