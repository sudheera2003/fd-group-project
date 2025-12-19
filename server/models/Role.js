// server/models/Role.js
const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, // Stores 'Admin' as 'admin'
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);