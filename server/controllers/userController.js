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

    const user = await User.findById(id).populate('role', 'name');

    if (!user) return res.status(404).json({ message: "User not found" });

    // --- NEW CHECK: IS USER ON A TEAM? ---
    // If teamId is not null, block deletion
    if (user.teamId) {
      return res.status(400).json({ 
        message: "User is currently assigned to a team. Please remove them from the team first." 
      });
    }

    const userRole = user.role?.name?.toLowerCase(); 

    // --- CHECK 1: ORGANIZER VALIDATION (Existing logic) ---
    if (userRole === 'organizer') {
      const projectCount = await Project.countDocuments({ 
        "team.organizerEmail": { $regex: new RegExp(`^${user.email}$`, "i") }
      });

      if (projectCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete: This Organizer owns ${projectCount} active project(s). Please delete them first.` 
        });
      }
      
      // Note: The 'teamId' check above catches organizers in teams, 
      // but keeping your specific organizer/team query as a fallback is fine.
      const team = await Team.findOne({ organizer: id }); 
      if (team) {
        return res.status(400).json({ 
          message: `Cannot delete: This Organizer still manages the team "${team.name}". Please delete the team first.` 
        });
      }
    }

    // --- CHECK 2: MEMBER CLEANUP (Existing logic) ---
    // If they passed the teamId check above, they are not "officially" in a team,
    // but we can run this cleanup just in case there's stale data.
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