import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

export const sendEmail = async ({
  to,
  subject,
  htmlBody,
}: SendEmailParams): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: htmlBody,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};

export const sendVerificationCodeEmail = async (
  email: string,
  code: string,
  fullName: string
): Promise<void> => {
  const subject = "Verify Your Email Address";
  const htmlBody = `
    <h1>Hello ${fullName},</h1>
    <p>Thank you for signing up. Please use the following 6-digit code to verify your account:</p>
    <h2 style="color: #4CAF50;">${code}</h2>
    <p>This code will expire in 15 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;
  await sendEmail({ to: email, subject, htmlBody });
};

export const sendPasswordResetCodeEmail = async (
  email: string,
  code: string,
  fullName: string
): Promise<void> => {
  const subject = "Password Reset Request";
  const htmlBody = `
      <h1>Hello ${fullName},</h1>
      <p>You requested a password reset. Please use the following 6-digit code to reset your password:</p>
      <h2 style="color: #F44336;">${code}</h2>
      <p>This code will expire in 15 minutes.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `;
  await sendEmail({ to: email, subject, htmlBody });
};
