const express = require('express');
const router = express.Router();
const {getEventTypes,createEventType } = require('../controllers/eventTypesController');


router.get('/event-types', getEventTypes);
router.post('/event-types', createEventType);

module.exports = router;