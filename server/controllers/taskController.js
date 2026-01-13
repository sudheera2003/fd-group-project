const Task = require('../models/Task');
const Event = require('../models/Event');
const Project = require('../models/Project');
const User = require('../models/User');

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

    req.io.emit("task_update", { action: "create", taskId: newTask._id });

    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);

    req.io.emit("task_update", { action: "delete", taskId: req.params.id });

    res.status(200).json({ message: "Task deleted" });
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

    req.io.emit("task_update", { action: "status_change", taskId: req.params.id });

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

    req.io.emit("task_update", { action: "submitted", taskId: req.params.id });

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

    req.io.emit("task_update", { action: "reviewed", taskId: req.params.id });

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPendingReviews = async (req, res) => {
  try {
    // 1. Get the Organizer ID from the URL params
    const { organizerId } = req.params;

    // 2. Find the Organizer's Email (because Project stores email, not ID)
    const organizer = await User.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // 3. Find Projects where this Organizer's email is stored in 'team.organizerEmail'
    // Note: accessing nested field 'team.organizerEmail'
    const projects = await Project.find({ 'team.organizerEmail': organizer.email }).select('_id');
    
    // Extract IDs: ['project_id_1', 'project_id_2']
    const projectIds = projects.map(p => p._id);

    if (projectIds.length === 0) {
      return res.status(200).json([]); // No projects = No tasks
    }

    // 4. Find Events belonging to these Projects
    const events = await Event.find({ projectId: { $in: projectIds } }).select('_id');
    const eventIds = events.map(e => e._id);

    if (eventIds.length === 0) {
      return res.status(200).json([]); // No events = No tasks
    }

    // 5. Find Tasks in these Events that are 'In Review'
    const tasks = await Task.find({ 
        eventId: { $in: eventIds },
        status: 'In Review'
      })
      .populate('eventId', 'name')        // Show Event Name
      .populate('assignedTo', 'username email') // Show User details
      .sort({ submittedAt: -1 });         // Newest submissions first

    res.status(200).json(tasks);

  } catch (err) {
    console.error(err);
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

    req.io.emit("task_update", { action: "reassigned", taskId: id });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEventTasks, createTask, deleteTask, getMemberTasks, updateTaskStatus, submitTask, reviewTask, getPendingReviews, reassignTask };