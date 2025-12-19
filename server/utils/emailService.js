const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred provider
      auth: {
        user: process.env.EMAIL_USER, // Add these to your .env
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email send failed:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;