const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold'], 
    default: 'Planning' 
  },
  team: {
    id: String,
    name: String,
    organizerName: String,
    organizerEmail: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);