const User = require('../models/User');
const Role = require('../models/Role');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Task = require('../models/Task');

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('role', 'name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Update User Role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName } = req.body;

    const newRole = await Role.findOne({ name: roleName });
    if (!newRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { role: newRole._id }, 
      { new: true }
    ).populate('role', 'name');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Assumes your Role model has a field called 'name' (e.g., "organizer")
    const user = await User.findById(id).populate('role', 'name');

    if (!user) return res.status(404).json({ message: "User not found" });

    // Extract the string name safely (handling cases where role might be missing)
    const userRole = user.role?.name?.toLowerCase(); 

    // --- CHECK 1: ORGANIZER VALIDATION ---
    if (userRole === 'organizer') {
      
      // 1. Check for Active Projects
      // Using regex for case-insensitive email matching just to be safe
      const projectCount = await Project.countDocuments({ 
        "team.organizerEmail": { $regex: new RegExp(`^${user.email}$`, "i") }
      });

      if (projectCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete: This Organizer owns ${projectCount} active project(s). Please delete them first.` 
        });
      }

      // 2. Check for Active Teams
      const team = await Team.findOne({ organizer: id }); 
      
      if (team) {
        return res.status(400).json({ 
          message: `Cannot delete: This Organizer still manages the team "${team.name}". Please delete the team first.` 
        });
      }
    }

    // --- CHECK 2: MEMBER VALIDATION ---
    if (userRole === 'member') {
      await Team.updateMany(
        { members: id }, 
        { $pull: { members: id } }
      );

      await Task.updateMany(
        { assignedTo: id },
        { 
          $set: { 
            assignedTo: null, 
            status: 'To Do',
            submissionNote: '', 
            submissionLink: '' 
          } 
        }
      );
    }

    // --- FINAL DELETE ---
    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Update User Profile (Self)
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    // Only allow updating name and email
    const { username, email } = req.body; 

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { username, email }, 
      { new: true }
    ).populate('role', 'name'); // Ensure we return the populated role

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, updateUserRole, deleteUser, updateUserProfile };