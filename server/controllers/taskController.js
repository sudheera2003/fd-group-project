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

// Get tasks assigned to a specific user
const getMemberTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    // We populate 'eventId' so the member knows WHICH event the task is for
    const tasks = await Task.find({ assignedTo: userId })
      .populate({
        path: 'eventId',           
        select: 'name date venue', 
        populate: {                
          path: 'venue',
          select: 'name location'  
        }
      })
      .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true } // Return the updated document
    );
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitTask = async (req, res) => {
  try {
    const { note, link } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'In Review',
        submissionNote: note,
        submissionLink: link,
        submittedAt: new Date(),
        organizerFeedback: "" // Clear old rejection feedback if any
      },
      { new: true }
    );
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reviewTask = async (req, res) => {
  try {
    const { status, feedback } = req.body; // Status will be 'Done' or 'In Progress' (Reject)
    
    const updateData = {
      status,
      reviewedAt: new Date(),
      organizerFeedback: feedback || "" 
    };

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPendingReviews = async (req, res) => {
  try {
    // In a real app, you would filter this by the Organizer's ID (via req.user)
    // For now, we fetch ALL tasks with status 'In Review'
    const tasks = await Task.find({ status: 'In Review' })
      .populate('eventId', 'name') // We need to know which Event it belongs to
      .populate('assignedTo', 'username email') // We need to know who submitted it
      .sort({ submittedAt: -1 }); // Oldest or Newest first? Let's do newest.

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reassignTask = async (req, res) => {
  try {
    const { id } = req.params;       // Task ID
    const { memberId } = req.body;   // New Member ID

    // 1. Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      id, 
      { 
        assignedTo: memberId,
        // Optional: If the task was "Done" but now reassigned, maybe reset status?
        // For now, let's keep the existing status or force it to 'To Do' if you prefer.
      }, 
      { new: true }
    ).populate('assignedTo', 'username email');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEventTasks, createTask, deleteTask, getTeamMembers, getMemberTasks, updateTaskStatus, submitTask, reviewTask, getPendingReviews, reassignTask };