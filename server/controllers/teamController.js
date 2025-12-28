const Team = require("../models/Team");
const User = require("../models/User");

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

// 3. Delete Team Logic
// Since you now lock users into a team by setting their teamId, 
// you have created a constraint. Later, when you implement "Delete Team," you must remember to free them.

// Task: When a team is deleted, find all members of that team and set their teamId back to null. 
// Otherwise, they will be stuck forever and can't join new teams.
module.exports = { createTeam, getTeams };
