import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/User.js";
import { Business } from "../models/Business.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import {
  generateAccessToken,
  generateRefreshToken
} from "../services/jwt.service.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/mail.service.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";

export class AuthController {
  // REGISTER
  static async register(req: Request, res: Response) {
    try {
      const { name, email, phone, password, businessName, language } = req.body;

      if (!email && !phone)
        return res.status(400).json({ error: "Email or phone required" });

      const exists = await User.findOne({ $or: [{ email }, { phone }] });
      if (exists) return res.status(400).json({ error: "User already exists" });

      const business = await Business.create({
        name: businessName,
        language,
        contactPhone: phone
      });

      const passwordHash = password ? await hashPassword(password) : undefined;

      const verificationToken = crypto.randomBytes(30).toString("hex");

     

      if (email) { 
        
        sendVerificationEmail(email, verificationToken)
  .catch(err => console.error("Email Error:", err));

      }
 const user = await User.create({
        name,
        email,
        phone,
        passwordHash,
        provider: "local",
        role: "owner",
        businessId: business._id,
        verificationToken
      });
      return res.status(201).json({
        message: "User registered. Please verify your email.",
        user
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Registration failed" });
    }
  }

  // LOGIN
  static async login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isSuspended) {
      return res.status(403).json({
        error: "Account suspended",
        reason: user.suspensionReason,
        suspendedAt: user.suspendedAt
      });
    }

    if (!user.passwordHash)
      return res.status(400).json({ error: "Use social login instead" });

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    if (!user.isVerified && user.email) {
      return res.status(403).json({
        error: "Please verify your email before logging in",
        isVerified: false
      });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens.push(refreshToken);
    
    // ⚠️ MAKE SURE THIS HAS AWAIT ⚠️
    await user.save(); // This line might be missing await

    // ⚠️ ALSO CHECK IF YOU'RE RETURNING THE RESPONSE
    return res.json({ accessToken, refreshToken, user });
    
  } catch (err) {
    console.error('Login error:', err); // Add detailed error logging
    return res.status(500).json({ error: "Login failed" });
  }
}

  // EMAIL VERIFY
  static async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: "Invalid token" });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  }

  // REFRESH TOKEN
  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(400).json({ error: "Missing refresh token" });

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(403).json({ error: "Invalid refresh token" });

    const newAccess = generateAccessToken(user._id.toString());
    const newRefresh = generateRefreshToken(user._id.toString());

    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefresh);
    await user.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  }

  // LOGOUT
  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await user.save();
    }

    return res.json({ message: "Logged out" });
  }

  static async forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If this email exists, a reset link was sent." });
    }

    const token = crypto.randomBytes(30).toString("hex");

    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    sendPasswordResetEmail(email, token)
  .catch(err => console.error("Email Error:", err));


    return res.json({ message: "Password reset link sent to email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send password reset email" });
  }
}
static async resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    const record = await PasswordResetToken.findOne({ token });
    if (!record) return res.status(400).json({ error: "Invalid or expired token" });

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await PasswordResetToken.deleteMany({ userId: user._id });

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Could not reset password" });
  }
}
static async changePassword(req: Request, res: Response) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { oldPassword, newPassword } = req.body;

    if (!user.passwordHash)
      return res.status(400).json({ error: "Your account uses social login" });

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Incorrect old password" });

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Could not change password" });
  }
}
}
