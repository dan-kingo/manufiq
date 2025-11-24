import mongoose, { Schema, Document } from "mongoose";

export interface ISyncOp extends Document {
  opId: string;
  businessId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: "adjust" | "create" | "update" | "delete";
  entityType: "item" | "tag" | "business";
  payload: Record<string, any>;
  clientTimestamp?: Date;
  appliedAt: Date;
  source: "client" | "server";
  status: "pending" | "applied" | "conflict" | "failed";
  conflictReason?: string;
  itemId?: mongoose.Types.ObjectId;
}

const syncOpSchema = new Schema<ISyncOp>(
  {
    opId: { type: String, required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["adjust", "create", "update", "delete"],
      required: true
    },
    entityType: {
      type: String,
      enum: ["item", "tag", "business"],
      required: true,
      default: "item"
    },
    payload: { type: Schema.Types.Mixed, required: true },
    clientTimestamp: { type: Date },
    appliedAt: { type: Date, default: Date.now, required: true },
    source: {
      type: String,
      enum: ["client", "server"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "applied", "conflict", "failed"],
      default: "pending"
    },
    conflictReason: { type: String },
    itemId: { type: Schema.Types.ObjectId, ref: "Item" }
  },
  { timestamps: true }
);

syncOpSchema.index({ businessId: 1, appliedAt: -1 });
syncOpSchema.index({ opId: 1 });
syncOpSchema.index({ businessId: 1, status: 1 });
syncOpSchema.index({ itemId: 1, appliedAt: -1 });
syncOpSchema.index({ appliedAt: 1 });

export const SyncOp = mongoose.model<ISyncOp>("SyncOp", syncOpSchema);
