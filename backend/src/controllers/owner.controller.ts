import {Request, Response} from "express";
import { Types } from "mongoose";
import {User} from "../models/User.js";
import { hashPassword } from "../utils/hash.js";

export class OwnerController {

    static async createStaff(req: Request, res: Response) {
      try {
        const ownerId = req.user?.id;
        if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

        const owner = await User.findById(ownerId);
        if (!owner) return res.status(404).json({ error: "Owner not found" });
        if (owner.role !== "owner") return res.status(403).json({ error: "Only owners can create staff" });

        const { name, email, phone, password, provider } = req.body;

        if (!name || !email || !phone || !password)
          return res.status(400).json({ error: "name, email, phone and password are required" });

        const exists = await User.findOne({ $or: [{ email }, { phone }] });
        if (exists) return res.status(400).json({ error: "User with given email or phone already exists" });

        const businessId = owner.businessId;
        if (!businessId) return res.status(400).json({ error: "Owner has no businessId" });

        const passwordHash = await hashPassword(password);

        const staff = await User.create({
          name,
          email,
          phone,
          passwordHash,
          provider: provider || "local",
          role: "staff",
          businessId,
          isVerified: true
        });

        // remove sensitive fields before returning
        const returned = staff.toObject();
        const safeReturned = returned as any;
        delete safeReturned.passwordHash;
        delete safeReturned.refreshTokens;
        delete safeReturned.verificationToken;

        return res.status(201).json({ message: "Staff created", staff: returned });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create staff" });
      }
    }

    static async getStaff(req: Request, res: Response) {
      try {
        const ownerId = req.user?.id;
        if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

        const owner = await User.findById(ownerId).select("businessId role");
        if (!owner) return res.status(404).json({ error: "Owner not found" });
        if (owner.role !== "owner") return res.status(403).json({ error: "Only owners can view staff" });

        const staff = await User.find({ businessId: owner.businessId, role: "staff" }).select("-passwordHash -refreshTokens -verificationToken");

        return res.json({ staff });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve staff" });
      }
    }

    static async updateStaff(req: Request, res: Response) {
      try {
        const ownerId = req.user?.id;
        if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

        const owner = await User.findById(ownerId).select("businessId role");
        if (!owner) return res.status(404).json({ error: "Owner not found" });
        if (owner.role !== "owner") return res.status(403).json({ error: "Only owners can update staff" });

        let { id } = req.params;
        if (!id) return res.status(400).json({ error: "Staff id is required" });

        // strip any non-hex characters that can appear from malformed params (e.g. trailing braces)
        id = id.replace(/[^a-fA-F0-9]/g, "");

        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid staff id" });

        const staff = await User.findById(id);
        if (!staff) return res.status(404).json({ error: "Staff not found" });
        if (staff.role !== "staff") return res.status(400).json({ error: "Target user is not staff" });
        if (!staff.businessId || staff.businessId.toString() !== owner.businessId?.toString())
          return res.status(403).json({ error: "Cannot modify staff from another business" });

        const { name, email, phone, password, provider, isVerified } = req.body;

        if (email && email !== staff.email) {
          const exists = await User.findOne({ email });
          if (exists && exists._id.toString() !== staff._id.toString())
            return res.status(400).json({ error: "Email already in use" });
          staff.email = email;
        }

        if (phone && phone !== staff.phone) {
          const exists = await User.findOne({ phone });
          if (exists && exists._id.toString() !== staff._id.toString())
            return res.status(400).json({ error: "Phone already in use" });
          staff.phone = phone;
        }

        if (name) staff.name = name;
        if (provider) staff.provider = provider;
        if (typeof isVerified === "boolean") staff.isVerified = isVerified;

        if (password) {
          staff.passwordHash = await hashPassword(password);
        }

        await staff.save();
        const returned = staff.toObject();
        const safeReturned = returned as any;
        delete safeReturned.passwordHash;
        delete safeReturned.refreshTokens;
        delete safeReturned.verificationToken;

        return res.json({ message: "Staff updated", staff: safeReturned });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update staff" });
      }
    }

    static async deleteStaff(req: Request, res: Response) {
      try {
        const ownerId = req.user?.id;
        if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

        const owner = await User.findById(ownerId).select("businessId role");
        if (!owner) return res.status(404).json({ error: "Owner not found" });
        if (owner.role !== "owner") return res.status(403).json({ error: "Only owners can delete staff" });

        const { id } = req.params;
        const staff = await User.findById(id);
        if (!staff) return res.status(404).json({ error: "Staff not found" });
        if (staff.role !== "staff") return res.status(400).json({ error: "Target user is not staff" });
        if (!staff.businessId || staff.businessId.toString() !== owner.businessId?.toString())
          return res.status(403).json({ error: "Cannot delete staff from another business" });

        await User.findByIdAndDelete(id);

        return res.json({ message: "Staff deleted" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete staff" });
      }
    }

    static async suspendUser(req: Request, res: Response) {
      try {
        const ownerId = req.user?.id;
        if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

        const owner = await User.findById(ownerId).select("businessId role");
        if (!owner) return res.status(404).json({ error: "Owner not found" });
        if (owner.role !== "owner") return res.status(403).json({ error: "Only owners can suspend users" });

        let { id } = req.params;
        if (!id) return res.status(400).json({ error: "User id is required" });
        id = id.replace(/[^a-fA-F0-9]/g, "");
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid user id" });

        const { reason } = req.body;

        const user = await User.findById(id);

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // cannot suspend admin or other owners
        if (user.role === "admin" || user.role === "owner") {
          return res.status(403).json({ error: "Cannot suspend admin or owner users" });
        }

        // owner cannot suspend users from other businesses
        if (!user.businessId || user.businessId.toString() !== owner.businessId?.toString()) {
          return res.status(403).json({ error: "Cannot suspend user from another business" });
        }

        // cannot suspend already suspended
        if (user.isSuspended) {
          return res.status(400).json({ error: "User already suspended" });
        }

        // cannot self-suspend
        if (user._id.toString() === ownerId.toString()) {
          return res.status(400).json({ error: "Cannot suspend yourself" });
        }

        user.isSuspended = true;
        user.suspensionReason = reason || "Suspended by owner";
        user.suspendedBy = ownerId as any;
        user.suspendedAt = new Date();
        await user.save();

        return res.json({
          message: "User suspended successfully",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isSuspended: user.isSuspended,
            suspensionReason: user.suspensionReason,
            suspendedAt: user.suspendedAt
          }
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to suspend user" });
      }
  }

  static async unsuspendUser(req: Request, res: Response) {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

      const owner = await User.findById(ownerId).select("businessId role");
      if (!owner) return res.status(404).json({ error: "Owner not found" });
      if (owner.role !== "owner") return res.status(403).json({ error: "Only owners can unsuspend users" });

      let { id } = req.params;
      if (!id) return res.status(400).json({ error: "User id is required" });
      id = id.replace(/[^a-fA-F0-9]/g, "");
      if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid user id" });

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // cannot unsuspend admin or owners here
      if (user.role === "admin" || user.role === "owner") {
        return res.status(403).json({ error: "Cannot unsuspend admin or owner users" });
      }

      if (!user.businessId || user.businessId.toString() !== owner.businessId?.toString()) {
        return res.status(403).json({ error: "Cannot unsuspend user from another business" });
      }

      if (!user.isSuspended) {
        return res.status(400).json({ error: "User is not suspended" });
      }

      user.isSuspended = false;
      user.suspensionReason = undefined;
      user.suspendedBy = undefined;
      user.suspendedAt = undefined;
      await user.save();

      return res.json({
        message: "User unsuspended successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isSuspended: user.isSuspended
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to unsuspend user" });
    }
  }
}