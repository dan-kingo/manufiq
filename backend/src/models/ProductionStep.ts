import mongoose, { Schema, Document } from "mongoose";

export interface IProductionStep extends Document {
  orderId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  stepNumber: number;
  description: string;
  isCompleted: boolean;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productionStepSchema = new Schema<IProductionStep>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    stepNumber: { type: Number, required: true },
    description: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
    notes: { type: String }
  },
  { timestamps: true }
);

productionStepSchema.index({ orderId: 1, stepNumber: 1 });
productionStepSchema.index({ businessId: 1, createdAt: -1 });
productionStepSchema.index({ orderId: 1, isCompleted: 1 });

export const ProductionStep = mongoose.model<IProductionStep>("ProductionStep", productionStepSchema);
