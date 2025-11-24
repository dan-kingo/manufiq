import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  materialId: mongoose.Types.ObjectId;
  materialName: string;
  quantity: number;
  unit: "pcs" | "kg" | "ltr";
}

export interface IOrder extends Document {
  businessId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerName?: string;
  customerContact?: string;
  items: IOrderItem[];
  dueDate: Date;
  status: "not_started" | "in_progress" | "halfway" | "completed" | "delivered" | "cancelled";
  completionPercentage: number;
  assignedTo?: mongoose.Types.ObjectId[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  completedAt?: Date;
  deliveredAt?: Date;
  receiptId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ["pcs", "kg", "ltr"], required: true }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    orderNumber: { type: String, required: true },
    customerName: { type: String },
    customerContact: { type: String },
    items: [orderItemSchema],
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "halfway", "completed", "delivered", "cancelled"],
      default: "not_started"
    },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    completedAt: { type: Date },
    deliveredAt: { type: Date },
    receiptId: { type: Schema.Types.ObjectId, ref: "Receipt" }
  },
  { timestamps: true }
);

orderSchema.index({ businessId: 1, createdAt: -1 });
orderSchema.index({ businessId: 1, status: 1 });
orderSchema.index({ businessId: 1, dueDate: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ assignedTo: 1, status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
