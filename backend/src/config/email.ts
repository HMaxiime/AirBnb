import nodemailer from "nodemailer";

// Build one reusable SMTP transporter for the whole app.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),

  // secure:false is common for TLS-based SMTP servers on port 587.
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Reuse this helper whenever the app needs to send a plain HTML email.
export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export default transporter;

// For more complex emails, this file could export templated builders as well.

