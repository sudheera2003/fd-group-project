// controllers/venueController.js
const Venue = require('../models/Venue');

const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.json(venues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createVenue = async (req, res) => {
  try {
    const newVenue = new Venue(req.body);
    await newVenue.save();
    res.status(201).json({ message: "Venue created!" });
  } catch (err) {
    res.status(400).json({ message: "Failed to create venue. Name must be unique." });
  }
};

module.exports = { getVenues, createVenue };