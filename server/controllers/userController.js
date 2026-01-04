const User = require('../models/User');
const Role = require('../models/Role');

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
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, updateUserRole, deleteUser };