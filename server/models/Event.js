const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  durationMinutes: { type: Number, required: true }, 
  budget: { type: Number, default: 0 },
  
  color: { 
    type: String, 
    default: "#3b82f6" // Default
  },

  venue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Venue', 
    required: true 
  },
  eventType: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'EventType', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);