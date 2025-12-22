// server/models/EventTypes.js
const mongoose = require('mongoose');

const EventTypeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: false,
    trim: false
  }
}, { timestamps: true });

module.exports = mongoose.model('EventType', EventTypeSchema);