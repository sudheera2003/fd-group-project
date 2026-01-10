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

    req.io.emit("eventType_update", { action: "create" });

    res.status(201).json({ message: "Event Type created!" });
  } catch (err) {
    res.status(400).json({ message: "Failed to create type. Name must be unique." });
  }
};

const deleteEventType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await EventType.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Type not found" });

    req.io.emit("eventType_update", { action: "delete", id });

    res.json({ message: "Event Type deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateEventType = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await EventType.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Type not found" });

    req.io.emit("eventType_update", { action: "update", id });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getEventTypes, createEventType, deleteEventType, updateEventType };