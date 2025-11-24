import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryEvent extends Document {
  materialId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  delta: number;
  action: "added" | "sold" | "used" | "adjusted";
  reason?: string;
  timestamp: Date;
}

const inventoryEventSchema = new Schema<IInventoryEvent>(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    delta: { type: Number, required: true },
    action: {
      type: String,
      enum: ["added", "sold", "used", "adjusted"],
      required: true
    },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

inventoryEventSchema.index({ materialId: 1, timestamp: -1 });
inventoryEventSchema.index({ businessId: 1, timestamp: -1 });
inventoryEventSchema.index({ userId: 1, timestamp: -1 });

export const InventoryEvent = mongoose.model<IInventoryEvent>(
  "InventoryEvent",
  inventoryEventSchema
);
