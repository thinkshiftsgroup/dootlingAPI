import { Request, Response } from "express";
import * as authService from "../services/auth.service";
const generateUniqueUsername = (fullName: string): string => {
  const sanitizedName = fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const specialDigits = Math.floor(1000 + Math.random() * 9000).toString();
  let username = `${sanitizedName.substring(0, 11)}${specialDigits}`;
  return username;
};

export const signUp = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      message:
        "All required fields are missing: Full Name, Email, and Password.",
    });
  }

  try {
    const generatedUsername = generateUniqueUsername(fullName);

    const { user, token } = await authService.registerUser(
      fullName,
      email,
      generatedUsername,
      password
    );

    res.status(201).json({
      message: "Registration successful. You are now logged in.",
      user: user,
      token: token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
export const verifyEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ message: "Email and verification code are required." });
  }

  try {
    const { user, token } = await authService.verifyEmail(email, code);
    res.status(200).json({
      message: "Email successfully verified. You can now log in.",
      user,
      token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resendVerificationCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await authService.resendVerificationCode(email);
    res.status(200).json({
      message: "New verification code has been sent to your email.",
    });
  } catch (error: any) {
    const status = error.message.includes("already verified") ? 400 : 500;
    res.status(status).json({
      message: error.message || "Failed to resend verification code.",
    });
  }
};

export const signIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const { user, token } = await authService.loginUser(email, password);
    res.status(200).json({ message: "Login successful.", user, token });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await authService.forgotPassword(email);
    res.status(200).json({
      message: "Password reset code has been sent to your email.",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email, code, and new password are required." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long." });
  }

  try {
    const user = await authService.resetPassword(email, code, newPassword);
    res.status(200).json({ message: "Password successfully reset.", user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
