import mongoose, { Schema, Document } from "mongoose";

export interface IOrderHistory extends Document {
  orderId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: "created" | "status_changed" | "assigned" | "unassigned" | "edited" | "cancelled";
  previousStatus?: string;
  newStatus?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  notes?: string;
  timestamp: Date;
}

const orderHistorySchema = new Schema<IOrderHistory>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["created", "status_changed", "assigned", "unassigned", "edited", "cancelled"],
      required: true
    },
    previousStatus: { type: String },
    newStatus: { type: String },
    previousData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

orderHistorySchema.index({ orderId: 1, timestamp: -1 });
orderHistorySchema.index({ businessId: 1, timestamp: -1 });
orderHistorySchema.index({ userId: 1, timestamp: -1 });

export const OrderHistory = mongoose.model<IOrderHistory>("OrderHistory", orderHistorySchema);
