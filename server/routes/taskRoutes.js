const express = require('express');
const router = express.Router();
const { getEventTasks, createTask, deleteTask, getTeamMembers, getMemberTasks, updateTaskStatus, submitTask, reviewTask, getPendingReviews } = require('../controllers/taskController');

router.get('/event/:eventId', getEventTasks);
router.post('/', createTask);
router.delete('/:id', deleteTask);
router.get('/members/:teamId', getTeamMembers);
router.get('/member/:userId', getMemberTasks); 
router.patch('/:id/status', updateTaskStatus);  
router.post('/:id/submit', submitTask); 
router.post('/:id/review', reviewTask); 
router.get('/reviews/pending', getPendingReviews);

module.exports = router;