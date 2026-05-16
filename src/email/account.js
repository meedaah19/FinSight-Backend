import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async (email, resetLink) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset</h2>
      <a href="${resetLink}">Reset Password</a>
    `
  });
};

export default sendResetEmail;