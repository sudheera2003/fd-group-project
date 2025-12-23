const Project = require('../models/Project');

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
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Project deleted" });
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

module.exports = { getProjects, getMyProjects, createProject, deleteProject, getProjectById };