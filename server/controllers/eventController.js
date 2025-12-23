const Event = require('../models/Event');

// Get all events for a specific project
const getProjectEvents = async (req, res) => {
  try {
    const { projectId } = req.params;
    const events = await Event.find({ projectId }).sort({ date: 1 }); // Earliest first
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new event
const createEvent = async (req, res) => {
  const { projectId, name, date, venue } = req.body;
  try {
    const newEvent = new Event({ projectId, name, date, venue });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getProjectEvents, createEvent };