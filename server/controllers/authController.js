const Admin = require('../models/Admin');
const Organizer = require('../models/Organizer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/emailService'); 
const crypto = require('crypto');

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
    let user = null;
    let role = null;

    // 1. Check if user is an Admin
    const adminUser = await Admin.findOne({ email });
    if (adminUser) {
      user = adminUser;
      role = 'admin';
    }

    // 2. If not Admin, check if Organizer
    if (!user) {
      const organizerUser = await Organizer.findOne({ email });
      if (organizerUser) {
        user = organizerUser;
        role = 'organizer';
      }
    }

    // 3. If user not found in either collection
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 5. Generate Token and Respond
    const token = generateToken(user, role);

    // Send back the token + user info (excluding password)
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: role // 'admin' or 'organizer'
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user exists in either collection
    const admin = await Admin.findOne({ email });
    const organizer = await Organizer.findOne({ email });
    if (!admin && !organizer) {
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
    // Optional: Delete OTP immediately after use so it can't be reused
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

    // Try to update Admin first, then Organizer
    let user = await Admin.findOne({ email });
    if (user) {
      user.password = hashedPassword;
      await user.save();
    } else {
      user = await Organizer.findOne({ email });
      if (user) {
        user.password = hashedPassword;
        await user.save();
      }
    }
    
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
};

module.exports = { loginUser, forgotPassword, verifyOtp, resetPassword};