import express from 'express';
import { 
  getAllUsers,
  getUserById, 
  createUser,
  updateUser,
  deleteUser,
  getUserGroups,
  addUserGroup,
  updateUserGroup,
  deleteUserGroup,
  assignUserToGroup
} from '../controllers/userController.js';

const router = express.Router();

// User routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// User group routes
router.get('/groups', getUserGroups);
router.post('/groups', addUserGroup);
router.put('/groups/:id', updateUserGroup);
router.delete('/groups/:id', deleteUserGroup);

// Assign user to group
router.post('/:id/assign-group/:groupId', assignUserToGroup);

export default router;