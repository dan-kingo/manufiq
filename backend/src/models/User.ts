import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  provider: "local" | "google";
  providerId?: string;
  role: "owner" | "staff" | "admin";
  businessId?: mongoose.Types.ObjectId;
  isVerified: boolean;
  verificationToken?: string;
  refreshTokens: string[];
  isSuspended: boolean;
  suspensionReason?: string;
  suspendedBy?: mongoose.Types.ObjectId;
  suspendedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },

    passwordHash: String,

    provider: { type: String, enum: ["local", "google"], default: "local" },
    providerId: String,

    role: { type: String, enum: ["owner", "staff", "admin"], default: "owner" },

    businessId: { type: Schema.Types.ObjectId, ref: "Business" },

    isVerified: { type: Boolean, default: false },
    verificationToken: String,

    refreshTokens: [String],

    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
    suspendedBy: { type: Schema.Types.ObjectId, ref: "User" },
    suspendedAt: Date
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
