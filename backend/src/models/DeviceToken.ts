import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: "ios" | "android" | "web";
  deviceId?: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    platform: {
      type: String,
      enum: ["ios", "android", "web"],
      required: true
    },
    deviceId: { type: String },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

deviceTokenSchema.index({ userId: 1, isActive: 1 });
deviceTokenSchema.index({ token: 1 }, { unique: true });
deviceTokenSchema.index({ userId: 1, deviceId: 1 });

export const DeviceToken = mongoose.model<IDeviceToken>("DeviceToken", deviceTokenSchema);
