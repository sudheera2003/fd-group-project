const express = require('express');
const router = express.Router();
const {getEventTypes,createEventType, deleteEventType, updateEventType } = require('../controllers/eventTypesController');


router.get('/event-types', getEventTypes);
router.post('/event-types', createEventType);
router.put('/event-types/:id', updateEventType);
router.delete('/event-types/:id', deleteEventType);

module.exports = router;