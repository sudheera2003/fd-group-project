const express = require('express');
const router = express.Router(); // 1. Use Router, not app
const Role = require('../models/Role'); // Make sure to import Role
const User = require('../models/User'); // Make sure to import User

// Path is just '/search' because index.js adds '/api/users'
router.get('/search', async (req, res) => { // 2. Shortened path
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    // 1. First, find the IDs for 'member' and 'organizer' roles
    // Note: Ensure your DB actually HAS roles named exactly 'member' and 'organizer'
    const targetRoles = await Role.find({ 
      name: { $in: ['member', 'organizer'] } 
    });
    
    const roleIds = targetRoles.map(role => role._id);

    // 2. Search Users
    const users = await User.find({
      email: { $regex: query, $options: 'i' },
      role: { $in: roleIds }
    })
    .select('_id username email role')
    .populate('role', 'name')
    .limit(5);

    // 3. Format
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role ? user.role.name : 'unknown'
    }));

    res.json(formattedUsers);

  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router; // 3. Export the router