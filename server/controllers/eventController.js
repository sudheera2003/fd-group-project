const Event = require('../models/Event');
const Task = require('../models/Task');

// Get all events for a specific project
const getProjectEvents = async (req, res) => {
  try {
    const { projectId } = req.params;
    const events = await Event.find({ projectId })
      .populate('venue', 'name')
      .populate('eventType', 'name')
      .sort({ date: 1 }); 
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Delete an event and its associated tasks
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Task.deleteMany({ eventId: id });
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    req.io.emit("event_update", { action: "delete", eventId: id });

    res.json({ message: "Event and its tasks deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new event
const createEvent = async (req, res) => {
  const { 
    projectId, 
    name, 
    date, 
    venue, 
    durationMinutes, 
    budget, 
    eventType, 
    color
  } = req.body;

  try {
    const newEvent = new Event({ 
      projectId, 
      name, 
      date, 
      venue, 
      durationMinutes, 
      budget, 
      eventType, 
      color
    });
    
    await newEvent.save();
    await newEvent.populate(['venue', 'eventType']);

    req.io.emit("event_update", { action: "create", eventId: newEvent._id });

    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// Get ALL events (for calendar view)
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('venue', 'name')
      .populate('eventType', 'name')
      .sort({ date: 1 });

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = { 
  getProjectEvents, 
  getAllEvents,
  createEvent, 
  deleteEvent 
};
