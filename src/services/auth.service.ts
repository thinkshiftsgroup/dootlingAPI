import { prisma } from "../prisma";
import { User, Biodata } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { generateSixDigitCode } from "../utils/codeGenerator";
import {
  sendVerificationCodeEmail,
  sendPasswordResetCodeEmail,
} from "../utils/email";

const getExpiry = (minutes: number): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};
type UserWithBiodata = Omit<User, "password"> & { biodata: Biodata | null };

const generateAuthToken = (user: {
  id: string;
  email: string;
  username: string | null;
  isVerified: boolean;
  userType: string;
}): string => {
  const secret = process.env.JWT_SECRET || "YOUR_UNSAFE_DEFAULT_SECRET";
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
      userType: user.userType,
    },
    secret,
    { expiresIn: "7d" }
  );
};

export const registerUser = async (
  fullName: string,
  email: string,
  username: string,
  password: string
): Promise<{ user: Omit<User, "password">; token: string }> => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationCode = generateSixDigitCode();
  const verificationCodeExpires = getExpiry(15);

  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      username,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires,
      // isVerified: true,
      userType: "user",
    },
  });

  const token = generateAuthToken(newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  const newBiodata = await prisma.biodata.create({
    data: {
      userId: newUser.id,
      dateOfBirth: new Date(),
      headline: `A new member, ${
        newUser.fullName || newUser.email
      }, has joined!`,
    },
  });

  const userWithBiodata: UserWithBiodata = {
    ...userWithoutPassword,
    biodata: newBiodata,
  };
  await sendVerificationCodeEmail(
    newUser.email,
    verificationCode,
    newUser.fullName
  );

  return { user: userWithBiodata, token };
};

export const verifyEmail = async (
  email: string,
  code: string
): Promise<{ token: string; user: Omit<User, "password"> }> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.isVerified) {
    throw new Error("Email is already verified.");
  }

  if (
    user.verificationCode !== code ||
    user.verificationCodeExpires! < new Date()
  ) {
    throw new Error("Invalid or expired verification code.");
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    },
    include: {
      biodata: true,
    },
  });

  const token = generateAuthToken(updatedUser);

  const { password: _, ...userWithoutPassword } = updatedUser;

  return { user: userWithoutPassword, token };
};

export const resendVerificationCode = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`Resend requested for non-existent email: ${email}`);
    throw new Error("User not found.");
  }

  if (user.isVerified) {
    throw new Error("Email is already verified. Please log in.");
  }

  const newVerificationCode = generateSixDigitCode();
  const newVerificationCodeExpires = getExpiry(15);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode: newVerificationCode,
      verificationCodeExpires: newVerificationCodeExpires,
    },
  });

  await sendVerificationCodeEmail(
    user.email,
    newVerificationCode,
    user.fullName
  );
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: Omit<User, "password">; token: string }> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { biodata: true },
  });
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email address first.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials.");
  }

  const token = generateAuthToken(user);

  const { password: _, ...userWithBiodata } = user;

  return { user: userWithBiodata, token };
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  const resetCode = generateSixDigitCode();
  const resetExpires = getExpiry(15);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetCode,
      resetPasswordExpires: resetExpires,
    },
  });

  await sendPasswordResetCodeEmail(user.email, resetCode, user.fullName);
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<Omit<User, "password">> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found.");
  }

  if (
    user.resetPasswordToken !== code ||
    user.resetPasswordExpires! < new Date()
  ) {
    throw new Error("Invalid or expired password reset code.");
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newHashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  const { password: _, ...userWithoutPassword } = updatedUser;

  return userWithoutPassword;
};
