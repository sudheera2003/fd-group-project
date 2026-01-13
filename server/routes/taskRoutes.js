const express = require('express');
const router = express.Router();
const { getEventTasks, createTask, deleteTask, getMemberTasks, updateTaskStatus, submitTask, reviewTask, getPendingReviews, reassignTask } = require('../controllers/taskController');

router.get('/event/:eventId', getEventTasks);
router.post('/', createTask);
router.delete('/:id', deleteTask);
router.get('/member/:userId', getMemberTasks); 
router.patch('/:id/status', updateTaskStatus);  
router.post('/:id/submit', submitTask); 
router.post('/:id/review', reviewTask); 
router.get('/reviews/pending/:organizerId', getPendingReviews);
router.patch('/:id/assign', reassignTask);

module.exports = router;