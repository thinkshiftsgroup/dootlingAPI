import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const signUp = async (req: Request, res: Response) => {
  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !username || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const newUser = await authService.registerUser(
      fullName,
      email,
      username,
      password
    );
    const {
      password: _,
      verificationCode: __,
      verificationCodeExpires: ___,
      ...userResponse
    } = newUser;

    res.status(201).json({
      message:
        "User registered successfully. Check your email for a verification code.",
      user: userResponse,
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
    await authService.verifyEmail(email, code);
    res
      .status(200)
      .json({ message: "Email successfully verified. You can now log in." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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
