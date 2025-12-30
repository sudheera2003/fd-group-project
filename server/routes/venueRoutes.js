const express = require('express');
const router = express.Router();
const {getVenues,createVenue, deleteVenue, updateVenue } = require('../controllers/venueController');


router.get('/venues', getVenues);
router.post('/venues', createVenue);
router.put('/venues/:id', updateVenue);
router.delete('/venues/:id', deleteVenue);

module.exports = router;