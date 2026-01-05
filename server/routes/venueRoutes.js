const express = require('express');
const router = express.Router();
const {getVenues,createVenue, deleteVenue, updateVenue } = require('../controllers/venueController');


router.get('/', getVenues);
router.post('/', createVenue);
router.put('/:id', updateVenue);
router.delete('/:id', deleteVenue);

module.exports = router;