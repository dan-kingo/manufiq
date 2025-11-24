import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  businessId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  type: "low_stock" | "out_of_stock" | "expiry_warning" | "critical";
  severity: "info" | "warning" | "critical";
  message: string;
  currentQuantity: number;
  threshold: number;
  isResolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    type: {
      type: String,
      enum: ["low_stock", "out_of_stock", "expiry_warning", "critical"],
      required: true
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      required: true,
      default: "warning"
    },
    message: { type: String, required: true },
    currentQuantity: { type: Number, required: true },
    threshold: { type: Number, required: true },
    isResolved: { type: Boolean, default: false },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

alertSchema.index({ businessId: 1, createdAt: -1 });
alertSchema.index({ itemId: 1, isResolved: 1 });
alertSchema.index({ businessId: 1, isResolved: 1, severity: 1 });

export const Alert = mongoose.model<IAlert>("Alert", alertSchema);
