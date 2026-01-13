const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../index");
const User = require("../../models/User");
const Task = require("../../models/Task");
const Role = require("../../models/Role");

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
});

// 3. Teardown: Close connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User Management Integration", () => {
  it("should create a new user successfully (POST /register)", async () => {
    // 1. Create the Role in the DB first (REQUIRED by your controller)
    const memberRole = await Role.create({ name: "Member" });

    // 2. Send the request to '/register'
    const res = await request(app)
      .post("/api/users/register") // 👈 UPDATED: Matches app.use("/", userRoutes)
      .send({
        username: "IntegrationUser",
        email: "test@example.com",
        password: "password123",
        role: memberRole._id, // 👈 UPDATED: Sends a valid Real ID
      });

    // 3. Verify
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered successfully!");
  });

  it("should successfully delete a user who is not in a team (DELETE /api/users/:id)", async () => {
    const memberRole = await Role.create({ name: "Member" });

    const user = await User.create({
      username: "ToBeDeleted",
      email: "delete@me.com",
      password: "123",
      role: memberRole._id,
    });

    const res = await request(app).delete(`/api/users/${user._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull(); 
});
});
