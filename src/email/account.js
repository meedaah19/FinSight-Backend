import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  port: 587,
  secure: false,
});

const sendResetEmail = async (email, resetLink) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset</h2>
      <p>Click below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `,
  });
};
export default sendResetEmail;