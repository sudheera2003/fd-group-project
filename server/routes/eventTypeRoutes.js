const express = require('express');
const router = express.Router();
const {getEventTypes,createEventType, deleteEventType, updateEventType } = require('../controllers/eventTypesController');


router.get('/', getEventTypes);
router.post('/', createEventType);
router.put('/:id', updateEventType);
router.delete('/:id', deleteEventType);

module.exports = router;