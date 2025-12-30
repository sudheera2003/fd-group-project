const express = require('express');
const router = express.Router();
const {getVenues,createVenue } = require('../controllers/venueController');


router.get('/venues', getVenues);
router.post('/venues', createVenue);

module.exports = router;