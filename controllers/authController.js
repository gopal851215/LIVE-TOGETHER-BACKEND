import asyncHandler from "express-async-handler";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === "host" ? "host" : "guest",
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400);
    throw new Error("Missing Google ID token");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const email = payload.email;
  const name = payload.name;
  const googleId = payload.sub;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: crypto.randomBytes(16).toString("hex"),
      googleId,
      role: "guest",
    });
  } else {
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  }

  
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("No user found with that email");
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetTokenExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
    email
  )}`;

  const message = `You requested a password reset. Click the link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  await sendEmail({
    to: user.email,
    subject: "Password Reset Request",
    text: message,
  });

  res.json({ message: "Password reset email sent" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    res.status(400);
    throw new Error("Token, email, and password are required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    email,
    resetToken: hashedToken,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  user.password = password;
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});
