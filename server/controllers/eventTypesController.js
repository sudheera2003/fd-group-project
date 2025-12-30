
const EventType = require('../models/EventType');

const getEventTypes = async (req, res) => {
  try {
    const types = await EventType.find().sort({ createdAt: -1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createEventType = async (req, res) => {
  try {
    const newType = new EventType(req.body);
    await newType.save();
    res.status(201).json({ message: "Event Type created!" });
  } catch (err) {
    res.status(400).json({ message: "Failed to create type. Name must be unique." });
  }
};

module.exports = { getEventTypes, createEventType };