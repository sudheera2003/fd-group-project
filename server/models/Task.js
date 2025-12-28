const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to Member
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'Done', 'Review'], 
    default: 'To Do' 
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);