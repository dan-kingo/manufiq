import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  alertId?: mongoose.Types.ObjectId;
  type: "low_stock" | "out_of_stock" | "expiry_warning" | "critical" | "system";
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  channels: ("push" | "email" | "in_app")[];
  sentVia: ("push" | "email" | "in_app")[];
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    alertId: { type: Schema.Types.ObjectId, ref: "Alert" },
    type: {
      type: String,
      enum: ["low_stock", "out_of_stock", "expiry_warning", "critical", "system"],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    channels: [{
      type: String,
      enum: ["push", "email", "in_app"],
      required: true
    }],
    sentVia: [{
      type: String,
      enum: ["push", "email", "in_app"]
    }]
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ businessId: 1, createdAt: -1 });
notificationSchema.index({ alertId: 1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
