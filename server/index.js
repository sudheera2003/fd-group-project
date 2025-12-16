// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // Wrap express with HTTP for WebSockets

const Admin = require('./models/Admin');
const Organizer = require('./models/Organizer');
const bcrypt = require('bcryptjs');

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check both collections to ensure unique emails across the whole system
    const existingAdmin = await Admin.findOne({ email });
    const existingOrganizer = await Organizer.findOne({ email });

    if (existingAdmin || existingOrganizer) {
      return res.status(400).json({ message: "User with this email already exists." });
    }
    // ----------------------------------

    // 1. Security: Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Logic: Decide where to save based on Role
    if (role === 'admin') {
      const newAdmin = new Admin({ username, email, password: hashedPassword, role });
      await newAdmin.save();
      return res.status(201).json({ message: "Admin registered successfully!" });
    } 
    
    else if (role === 'organizer') {
      const newOrganizer = new Organizer({ username, email, password: hashedPassword, role });
      await newOrganizer.save();
      return res.status(201).json({ message: "Organizer registered successfully!" });
    } 
    
    else {
      return res.status(400).json({ message: "Invalid Role Selected" });
    }

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

console.log("Current Mongo URI:", process.env.MONGO_URI);

// Database Connection (MongoDB)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});