const Task = require('../models/Task');
const Team = require('../models/Team'); // Needed to fetch members

// Get tasks for a specific event
const getEventTasks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const tasks = await Task.find({ eventId })
      .populate('assignedTo', 'username email'); // Show who is doing it
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new task
const createTask = async (req, res) => {
  const { eventId, description, assignedTo, priority } = req.body;
  try {
    const newTask = new Task({ eventId, description, assignedTo, priority });
    await newTask.save();
    
    // Return the populated task so the UI updates instantly
    await newTask.populate('assignedTo', 'username'); 
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: Get Team Members (So organizer knows who to assign)
const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId).populate('members', 'username email');
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.status(200).json(team.members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEventTasks, createTask, deleteTask, getTeamMembers };