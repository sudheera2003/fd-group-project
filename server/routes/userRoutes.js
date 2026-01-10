const express = require('express');
const router = express.Router(); // 1. Use Router, not app
const Role = require('../models/Role'); // Make sure to import Role
const User = require('../models/User'); // Make sure to import User
const { getUsers, updateUserRole, deleteUser, updateUserProfile, getUserById, searchUsers, registerUser } = require('../controllers/userController');

// Path is just '/search' because index.js adds '/api/users'
router.get('/search', searchUsers);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.put('/users/:id', updateUserProfile);
router.get('/users/:id', getUserById);
router.post('/register', registerUser); // 2. Define route for registration

module.exports = router; // 3. Export the router