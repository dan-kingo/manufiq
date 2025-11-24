import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  location?: string;
  contactPhone?: string;
  language: "en" | "am" | "om";
  verificationDocs: string[];
  status: "pending" | "approved" | "rejected" | "suspended";
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true },
    location: String,
    contactPhone: String,

    language: { type: String, enum: ["en", "am", "om"], default: "en" },

    verificationDocs: [String],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending"
    },
    rejectionReason: String,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date
  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>("Business", businessSchema);
