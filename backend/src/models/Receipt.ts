import mongoose, { Schema, Document } from "mongoose";

export interface IReceipt extends Document {
  orderId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  receiptNumber: string;
  customerName?: string;
  customerContact?: string;
  items: Array<{
    materialName: string;
    quantity: number;
    unit: string;
  }>;
  completedSteps: Array<{
    stepNumber: number;
    description: string;
    notes?: string;
    completedBy?: {
      _id: string;
      name: string;
      email: string;
    };
  }>;
  completedAt: Date;
  deliveredAt: Date;
  issuedAt: Date;
  issuedBy: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  pdfUrl?: string;
  createdAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    receiptNumber: { type: String, required: true, },
    customerName: { type: String },
    customerContact: { type: String },
    items: [
      {
        materialName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true }
      }
    ],
    completedSteps: [
      {
        stepNumber: { type: Number, required: true },
        description: { type: String, required: true },
        notes: { type: String },
        completedBy: {
          _id: { type: String },
          name: { type: String },
          email: { type: String }
        }
      }
    ],
    completedAt: { type: Date, required: true },
    deliveredAt: { type: Date, required: true },
    issuedAt: { type: Date, required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pdfUrl: { type: String }
  },
  { timestamps: true }
);

receiptSchema.index({ orderId: 1 });
receiptSchema.index({ businessId: 1, createdAt: -1 });
receiptSchema.index({ receiptNumber: 1 }, { unique: true });

export const Receipt = mongoose.model<IReceipt>("Receipt", receiptSchema);
