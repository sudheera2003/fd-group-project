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

    req.io.emit("setting_update", { type: "venue" });
    
    res.status(201).json({ message: "Venue created!" });
  } catch (err) {
    res.status(400).json({ message: "Failed to create venue. Name must be unique." });
  }
};

const deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Venue.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Venue not found" });
    res.json({ message: "Venue deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Venue.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Venue not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getVenues, createVenue, deleteVenue, updateVenue };