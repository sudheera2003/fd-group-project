// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // Wrap express with HTTP for WebSockets

const Role = require('./models/Role');
const User = require('./models/User');
const Team = require('./models/Team');
const bcrypt = require('bcryptjs');

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
// app.get('/', (req, res) => {
//   res.send('Backend is running!');
// });
app.use('/api/auth', authRoutes);

app.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

app.post('/register', async (req, res) => {
  try {
    // 'role' is now an ID (e.g., "65b12...") coming from the frontend
    const { username, email, password, role } = req.body;

    // Security Check: Does this Role ID actually exist in the database?
    const validRole = await Role.findById(role);
    if (!validRole) {
      return res.status(400).json({ message: "Invalid Role ID selected." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WebSocket Setup (Required for the assignment)
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from your React Client
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
});

// Database Connection (MongoDB)
mongoose.connect(process.env.MONGO_URI)
  .then(async() => {
    console.log('Connected to MongoDB Atlas');

    const rolesToCreate = ['admin', 'organizer', 'member'];

    for (const roleName of rolesToCreate) {
      // Check if this specific role exists
      const exists = await Role.findOne({ name: roleName });
      
      // If not, create it
      if (!exists) {
        await Role.create({ name: roleName });
        console.log(`Role '${roleName}' created!`);
      }
    }
    console.log("Database seeding check complete.");
  })
  .catch(err => console.error('MongoDB error:', err));

app.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('role', 'name'); 

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

//user search
app.get('/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    // 1. First, find the IDs for 'member' and 'organizer' roles
    const targetRoles = await Role.find({ 
      name: { $in: ['member', 'organizer'] } 
    });
    
    // Extract just the _id values (e.g., ["65a...", "65b..."])
    const roleIds = targetRoles.map(role => role._id);

    // 2. Search Users who have one of those Role IDs
    const users = await User.find({
      email: { $regex: query, $options: 'i' }, // Partial match on email
      role: { $in: roleIds } // Filter by the IDs we found
    })
    .select('_id username email role') // Select specific fields
    .populate('role', 'name')        // Turn the Role ID back into a name object
    .limit(5);

    // 3. Format the data for the frontend
    // The frontend expects role to be a string "admin", not an object {name: "admin"}
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role ? user.role.name : 'unknown' // Safety check
    }));

    res.json(formattedUsers);

  } catch (err) {
    console.error("Search Error:", err); // Log exact error to terminal
    res.status(500).json({ error: "Search failed" });
  }
});

//team creation

app.post('/teams', async (req, res) => {
  try {
    const { name, description, memberIds, adminId } = req.body;

    // Existing Name Check
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) return res.status(400).json({ message: "Team name already taken" });

    // Find ANY team where the 'members' array contains ANY of the IDs we are trying to add
    const conflictTeam = await Team.findOne({ 
      members: { $in: memberIds } 
    }).populate('members');

    if (conflictTeam) {
      // Find exactly which user is causing the problem
      const conflictingUser = conflictTeam.members.find(
        member => memberIds.includes(member._id.toString())
      );
      
      return res.status(400).json({ 
        message: `User '${conflictingUser.username}' is already in the team '${conflictTeam.name}'.` 
      });
    }
    // -------------------------------------------------------

    const newTeam = new Team({
      name,
      description,
      members: memberIds,
      createdBy: adminId
    });

    await newTeam.save();
    res.status(201).json({ message: "Team created successfully!" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get all teams

app.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'username email role') // Fetch member details
      .populate('createdBy', 'username')         // Fetch creator's name
      .sort({ createdAt: -1 });                  // Show newest first

    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});