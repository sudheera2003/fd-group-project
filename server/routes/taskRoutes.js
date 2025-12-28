const express = require('express');
const router = express.Router();
const { getEventTasks, createTask, deleteTask, getTeamMembers } = require('../controllers/taskController');

router.get('/event/:eventId', getEventTasks);
router.post('/', createTask);
router.delete('/:id', deleteTask);
router.get('/members/:teamId', getTeamMembers); 

module.exports = router;