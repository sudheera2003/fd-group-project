const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'In Review', 'Done'], 
    default: 'To Do' 
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },

  submissionNote: { type: String },       
  submissionLink: { type: String },       
  submittedAt: { type: Date },            
  
  organizerFeedback: { type: String },    
  reviewedAt: { type: Date }              
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);