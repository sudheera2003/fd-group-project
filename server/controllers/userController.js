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

    // 1. Find User first to check Team status
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- CHECK: IS USER ON A TEAM? ---
    if (user.teamId) {
      const team = await Team.findById(user.teamId);
      const teamName = team ? team.name : "Unknown Team";
      
      return res.status(400).json({ 
        message: `User is currently a member of the team "${teamName}". Please remove them from the team first.` 
      });
    }

    // 2. Find Role
    const newRole = await Role.findOne({ name: roleName });
    if (!newRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    // 3. Update User
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { role: newRole._id }, 
      { new: true }
    ).populate('role', 'name');

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate('role', 'name');

    if (!user) return res.status(404).json({ message: "User not found" });

    // --- CHECK: IS USER ON A TEAM? ---
    if (user.teamId) {
      // Find the team name to show in the error
      const team = await Team.findById(user.teamId);
      
      const teamName = team ? team.name : "a team"; // Fallback if team not found
      
      return res.status(400).json({ 
        message: `User is currently assigned to the team "${teamName}". Please remove them from the team first.` 
      });
    }

    const userRole = user.role?.name?.toLowerCase(); 

    // --- CHECK 1: ORGANIZER VALIDATION ---
    if (userRole === 'organizer') {
      const projectCount = await Project.countDocuments({ 
        "team.organizerEmail": { $regex: new RegExp(`^${user.email}$`, "i") }
      });

      if (projectCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete: This Organizer owns ${projectCount} active project(s). Please delete them first.` 
        });
      }
      
      // Fallback check in case teamId was somehow missing but they are set as organizer
      const team = await Team.findOne({ organizer: id }); 
      if (team) {
        return res.status(400).json({ 
          message: `Cannot delete: This Organizer still manages the team "${team.name}". Please delete the team first.` 
        });
      }
    }

    // --- CHECK 2: MEMBER CLEANUP ---
    if (userRole === 'member') {
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