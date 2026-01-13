const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../index");
const User = require("../../models/User");
const Task = require("../../models/Task");
const Role = require("../../models/Role");
const Team = require("../../models/Team");

let mongoServer;

// 1. Setup: Start the "In-Memory" Database before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// 2. Cleanup: Clear data between tests
afterEach(async () => {
  await User.deleteMany();
  await Task.deleteMany();
  await Role.deleteMany();
  await Team.deleteMany();
});

// 3. Teardown: Close connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Team Management Integration", () => {
  it("should create a new team successfully (POST /api/teams)", async () => {
    const organizerRole = await Role.create({ name: "Organizer" });
    const memberRole = await Role.create({ name: "Member" });

    const organizer = await User.create({
      username: "TeamCreator",
      email: "creator@test.com",
      password: "123",
      role: organizerRole._id,
    });

    const memberOne = await User.create({
      username: "MemberOne",
      email: "memberone@test.com",
      password: "123",
      role: memberRole._id,
    });

    // B. Action: Send POST request
    const res = await request(app)
      .post("/api/teams")
      .send({
        name: "Alpha Squad",
        description: "The best team",
        organizerId: organizer._id,
        memberIds: [memberOne._id] 
      });

    // C. Verify
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Alpha Squad");
    console.log(res.body);
    expect(res.body.organizer).toBe(organizer._id.toString());
  });

  it("should unassign tasks when a member is removed from the team (PUT /api/teams/:id)", async () => {
    const organizerRole = await Role.create({ name: "Organizer" });
    const memberRole = await Role.create({ name: "Member" });

    const organizer = await User.create({
      username: "TeamLead",
      email: "lead@test.com",
      password: "123",
      role: organizerRole._id,
    });

    const memberToRemove = await User.create({
      username: "MemberGoes",
      email: "bye@test.com",
      password: "123",
      role: memberRole._id,
    });

    const team = await Team.create({
      name: "Dev Team",
      organizer: organizer._id,
      members: [memberToRemove._id],
    });

    memberToRemove.teamId = team._id;
    await memberToRemove.save();

    const task = await Task.create({
      description: "Task that should be reset",
      eventId: new mongoose.Types.ObjectId(),
      assignedTo: memberToRemove._id,
      status: "In Progress",
      submissionNote: "Work is half done",
    });

    const res = await request(app).put(`/api/teams/${team._id}`).send({
      name: "Dev Team",
      description: "Updated description",
      organizerId: organizer._id,
      memberIds: [],
    });

    expect(res.statusCode).toBe(200);

    const updatedTask = await Task.findById(task._id);
    const updatedUser = await User.findById(memberToRemove._id);

    expect(updatedTask.assignedTo).toBeNull();
    expect(updatedTask.status).toBe("To Do");
    expect(updatedTask.submissionNote).toBe("");
    expect(updatedUser.teamId).toBeNull();
  });
});
