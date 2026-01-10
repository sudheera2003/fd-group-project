// server/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Wrap express with HTTP for WebSockets

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const teamRoutes = require("./routes/teamRoutes");
const eventRoutes = require("./routes/eventRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const venueRoutes = require("./routes/venueRoutes");
const eventTypeRoutes = require("./routes/eventTypeRoutes");
const roleRoutes = require("./routes/roleRoutes");
const Role = require("./models/Role");

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
// app.get('/', (req, res) => {
//   res.send('Backend is running!');
// });
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/event-types", eventTypeRoutes);
app.use("/", userRoutes);

// app.get('/roles', async (req, res) => {
//   try {
//     const roles = await Role.find();
//     res.json(roles);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch roles" });
//   }
// });

// WebSocket Setup (Required for the assignment)
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from your React Client
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
});

// Database Connection (MongoDB)
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("Connected to MongoDB Atlas");

      const rolesToCreate = ["admin", "organizer", "member"];

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
    .catch((err) => console.error("MongoDB error:", err));
}
// app.get('/users', async (req, res) => {
//   try {
//     const users = await User.find()
//       .select('-password')
//       .populate('role', 'name');

//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch users" });
//   }
// });

// 1. Export the 'app' so Jest can use it
module.exports = app;

// 2. Only listen to the port if running directly (NOT when testing)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
