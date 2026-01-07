const Team = require("../models/Team");
const User = require("../models/User");
const Project = require("../models/Project");

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
    // A. Find the existing team
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // B. Check Name Uniqueness (if name changed)
    if (name !== team.name) {
      const existingName = await Team.findOne({ name });
      if (existingName) {
        return res.status(400).json({ message: "Team name already taken" });
      }
    }

    // --- LOGIC FOR SWAPPING MEMBERS ---

    // 1. Identify Current IDs vs New IDs
    // Convert ObjectIds to strings for comparison
    const currentOrganizerId = team.organizer.toString();
    const currentMemberIds = team.members.map((m) => m.toString());
    const allCurrentIds = [currentOrganizerId, ...currentMemberIds];

    const newOrganizerId = organizerId;
    const newMemberIds = memberIds; // Array of strings
    const allNewIds = [newOrganizerId, ...newMemberIds];

    // 2. Identify Users Removed (To set teamId = null)
    // Users who were in the team but are NOT in the new list
    const usersToRemove = allCurrentIds.filter((uid) => !allNewIds.includes(uid));

    // 3. Identify Users Added (To check availability and set teamId = team._id)
    // Users who are in the new list but were NOT in the old list
    const usersToAdd = allNewIds.filter((uid) => !allCurrentIds.includes(uid));

    // 4. Validate 'usersToAdd' - Are they already in a DIFFERENT team?
    if (usersToAdd.length > 0) {
      const busyUsers = await User.find({
        _id: { $in: usersToAdd },
        teamId: { $ne: null }, // They have a team
      });

      if (busyUsers.length > 0) {
        const names = busyUsers.map((u) => u.username).join(", ");
        return res
          .status(400)
          .json({ message: `Users already in a team: ${names}` });
      }
    }

    // --- EXECUTE UPDATES ---

    // 5. Free the removed users
    if (usersToRemove.length > 0) {
      await User.updateMany(
        { _id: { $in: usersToRemove } },
        { $set: { teamId: null } }
      );
    }

    // 6. Bind the new users
    if (usersToAdd.length > 0) {
      await User.updateMany(
        { _id: { $in: usersToAdd } },
        { $set: { teamId: team._id } }
      );
    }

    // 7. Update the Team Document
    team.name = name;
    team.description = description;
    team.organizer = organizerId;
    team.members = memberIds;
    
    await team.save();

    // 8. Return populated team
    const updatedTeam = await Team.findById(team._id)
      .populate("organizer", "username email")
      .populate("members", "username email role")
      .populate("createdBy", "username");

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
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Delete Team Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 3. Delete Team Logic
// Since you now lock users into a team by setting their teamId, 
// you have created a constraint. Later, when you implement "Delete Team," you must remember to free them.

// Task: When a team is deleted, find all members of that team and set their teamId back to null. 
// Otherwise, they will be stuck forever and can't join new teams.
module.exports = { createTeam, getTeams, updateTeam, deleteTeam };
