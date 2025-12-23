const express = require('express');
const router = express.Router();
const { getProjectEvents, createEvent } = require('../controllers/eventController');

router.get('/:projectId', getProjectEvents);
router.post('/', createEvent);

module.exports = router;