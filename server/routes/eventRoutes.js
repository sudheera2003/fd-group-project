const express = require('express');
const router = express.Router();
const { getAllEvents,getProjectEvents, createEvent, deleteEvent } = require('../controllers/eventController');

router.get('/', getAllEvents);
router.get('/:projectId', getProjectEvents);
router.post('/', createEvent);
router.delete('/:id', deleteEvent);

module.exports = router;