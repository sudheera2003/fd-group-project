const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/emailService");
const crypto = require("crypto");

// Helper to generate Token
const generateToken = (user, role) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: role },
    process.env.JWT_SECRET,
    { expiresIn: 3600 }
  );
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check User Collection Only (and get the Role Name)
    // We use .populate('role') to turn the "ID" into the actual Role Object
    const user = await User.findOne({ email }).populate("role");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Extract Role Name Safely
    // Because we populated, user.role is an Object { _id: "...", name: "admin" }
    // If something is wrong with the DB, default to "user"
    const roleName = user.role ? user.role.name : "user";

    // 4. Generate Token
    const token = generateToken(user, roleName);

    // 5. Respond
    // We flatten the response so the frontend receives "role": "admin" (string)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: roleName, // Send the string name, not the object ID
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Unified Check: Just look in User table
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Save to DB (Auto-deletes after 5 mins)
    await Otp.create({ email, otp });

    // Send Email
    await sendEmail(email, "Password Reset Code", `Your code is: ${otp}`);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await Otp.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    // Delete OTP immediately after use
    await Otp.deleteOne({ _id: record._id });
    
    res.status(200).json({ message: "OTP Verified" });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Unified Update: Just update User table
    const user = await User.findOne({ email });
    
    if (user) {
      user.password = hashedPassword;
      await user.save();
      res.status(200).json({ message: "Password updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
    
  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
};

module.exports = { loginUser, forgotPassword, verifyOtp, resetPassword };