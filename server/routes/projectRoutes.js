const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  getMyProjects, 
  createProject, 
  deleteProject,
  getProjectById 
} = require('../controllers/projectController');

// Routes
router.get('/my-projects', getMyProjects); 
router.get('/', getProjects);
router.post('/', createProject);
router.delete('/:id', deleteProject);
router.get('/:id', getProjectById); 

module.exports = router;