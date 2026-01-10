const Team = require("../models/Team");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require('../models/Task');

// 1. Create Team with Validation
const createTeam = async (req, res) => {
  const { name, description, organizerId, memberIds, adminId } = req.body;

  try {
    // A. Check if Team Name exists
    const existingName = await Team.findOne({ name });
    if (existingName)
      return res.status(400).json({ message: "Team name already taken" });

    // B. Check if Organizer is already in a team
    const organizerUser = await User.findById(organizerId);
    if (!organizerUser)
      return res.status(404).json({ message: "Organizer not found" });
    if (organizerUser.teamId)
      return res
        .status(400)
        .json({
          message: `User ${organizerUser.username} is already in a team`,
        });

    // C. Check if any Member is already in a team
    const members = await User.find({ _id: { $in: memberIds } });
    for (const member of members) {
      if (member.teamId) {
        return res
          .status(400)
          .json({ message: `User ${member.username} is already in a team` });
      }
    }

    // D. Create the Team
    const newTeam = new Team({
      name,
      description,
      organizer: organizerId,
      members: memberIds,
      createdBy: adminId,
    });
    await newTeam.save();

    // E. Update all users involved to have this teamId
    await User.updateMany(
      { _id: { $in: [organizerId, ...memberIds] } },
      { $set: { teamId: newTeam._id } }
    );

    req.io.emit("team_update", { action: "create", teamId: newTeam._id });

    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Get Teams (Populate Names & Emails)
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("organizer", "username email") // Get Organizer details
      .populate("members", "username email role") // Get Member details
      .populate("createdBy", "username");
    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTeam = async (req, res) => {
  const { id } = req.params;
  const { name, description, organizerId, memberIds } = req.body;

  try {
    // 1. Find existing team & Populate Organizer to get their EMAIL
    const team = await Team.findById(id).populate('organizer', 'username email');
    
    if (!team) return res.status(404).json({ message: "Team not found" });

    // 2. Check Name Uniqueness
    if (name !== team.name) {
      const existingName = await Team.findOne({ name });
      if (existingName) {
        return res.status(400).json({ message: "Team name already taken" });
      }
    }

    // --- 🛑 CRITICAL CHECK: ORGANIZER SWAP via EMAIL ---
    const currentOrganizerId = team.organizer._id.toString();
    const currentOrganizerEmail = team.organizer.email; // We need this!

    if (organizerId !== currentOrganizerId) {
       // The Admin is trying to change the Organizer.
       
       // Check if the current organizer's EMAIL is listed on any active projects for this team
       const activeProject = await Project.findOne({
          "team.organizerEmail": currentOrganizerEmail, // Match by Email
          "team.id": id,                                // Match by Team ID
          status: { $in: ['Planning', 'In Progress'] }
       });

       if (activeProject) {
          return res.status(400).json({ 
             message: `Cannot change organizer: The current organizer (${team.organizer.username}) leads an active project "${activeProject.name}". Please complete or delete the project first.` 
          });
       }
    }

    // --- LOGIC FOR SWAPPING MEMBERS (Standard ID checks) ---

    // Setup ID Lists
    const currentMemberIds = team.members.map((m) => m.toString());
    const allCurrentIds = [currentOrganizerId, ...currentMemberIds];

    const newMemberIds = memberIds; 
    const allNewIds = [organizerId, ...newMemberIds];

    const usersToRemove = allCurrentIds.filter((uid) => !allNewIds.includes(uid));
    const usersToAdd = allNewIds.filter((uid) => !allCurrentIds.includes(uid));

    // Validate 'usersToAdd' (Check if busy)
    if (usersToAdd.length > 0) {
      const busyUsers = await User.find({
        _id: { $in: usersToAdd },
        teamId: { $ne: null }, 
      });

      if (busyUsers.length > 0) {
        const names = busyUsers.map((u) => u.username).join(", ");
        return res.status(400).json({ message: `Users already in a team: ${names}` });
      }
    }

    // --- EXECUTE UPDATES ---

    // Cleanup Removed Users
    if (usersToRemove.length > 0) {
      await User.updateMany(
        { _id: { $in: usersToRemove } },
        { $set: { teamId: null } }
      );

      // Unassign Tasks (Reset to 'To Do', no owner)
      await Task.updateMany(
        { assignedTo: { $in: usersToRemove } },
        { 
          $set: { 
            assignedTo: null, 
            status: 'To Do',
            submissionLink: '',
            submissionNote: ''
          } 
        }
      );
    }

    // Bind New Users
    if (usersToAdd.length > 0) {
      await User.updateMany(
        { _id: { $in: usersToAdd } },
        { $set: { teamId: team._id } }
      );
    }

    // Update the Team Document
    team.name = name;
    team.description = description;
    team.organizer = organizerId;
    team.members = memberIds;
    
    await team.save();

    // Return populated result
    const updatedTeam = await Team.findById(team._id)
      .populate("organizer", "username email")
      .populate("members", "username email role")
      .populate("createdBy", "username");

    req.io.emit("team_update", { action: "update", teamId: team._id });

    res.json(updatedTeam);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// 4. Delete Team
const deleteTeam = async (req, res) => {
  const { id } = req.params;

  try {
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // --- FIX: QUERY THE NESTED 'team.id' FIELD ---
    // We use quotes "team.id" to query inside the team object
    const project = await Project.findOne({ "team.id": id });

    // Debugging logs
    console.log(`Deleting Team ID: ${id}`);
    console.log(`Found Project:`, project);

    if (project) {
      return res.status(400).json({ 
        message: `Cannot delete: This team is assigned to the project "${project.name}". Please delete the project first.` 
      });
    }

    // --- FREE USERS FROM TEAM ---
    const allMemberIds = [team.organizer, ...team.members];
    await User.updateMany(
      { _id: { $in: allMemberIds } },
      { $set: { teamId: null } }
    );

    await Team.findByIdAndDelete(id);

    req.io.emit("team_update", { action: "delete", teamId: id });
    
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Delete Team Error:", err);
    res.status(500).json({ message: err.message });
  }
};

const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id)
      .populate("organizer", "username email")
      .populate("members", "username email role");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTeam, getTeams, updateTeam, deleteTeam, getTeamById };
