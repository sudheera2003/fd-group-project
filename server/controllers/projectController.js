const Project = require('../models/Project');
const Event = require('../models/Event'); 
const Task = require('../models/Task');

// Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get my projects
const getMyProjects = async (req, res) => {
  const { email } = req.query;
  try {
    // Find projects where the team.organizerEmail matches
    const projects = await Project.find({ "team.organizerEmail": email });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new project
const createProject = async (req, res) => {
  const { name, description, deadline, team } = req.body;
  try {
    const newProject = new Project({ name, description, deadline, team });
    await newProject.save();

    req.io.emit("project_update", { action: "create", projectId: newProject._id });

    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectEvents = await Event.find({ projectId: projectId });
    const eventIds = projectEvents.map(event => event._id);
    if (eventIds.length > 0) {
      await Task.deleteMany({ eventId: { $in: eventIds } });
    }
    await Event.deleteMany({ projectId: projectId });
    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    req.io.emit("project_update", { action: "delete", projectId });

    res.json({ message: "Project and all associated data deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    // We use { new: true } to return the updated document
    const updatedProject = await Project.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    req.io.emit("project_update", { action: "update", projectId: id });

    res.json(updatedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getProjects, getMyProjects, createProject, deleteProject, getProjectById, updateProjectById };