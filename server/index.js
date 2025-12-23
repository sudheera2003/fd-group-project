// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const teamRoutes = require('./routes/teamRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
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
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
 
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});