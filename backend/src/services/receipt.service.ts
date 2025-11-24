import PDFDocument from "pdfkit";
import { Receipt, IReceipt } from "../models/Receipt.js";
import { Order } from "../models/Order.js";
import { Business } from "../models/Business.js";
import mongoose from "mongoose";
import { uploadToCloudinary } from "./cloudinary.service.js";

export class ReceiptService {
  static async generateReceipt(
    orderId: mongoose.Types.ObjectId,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<IReceipt> {
    const order = await Order.findOne({ _id: orderId, businessId });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "delivered") {
      throw new Error("Order must be delivered to generate receipt");
    }

    if (order.receiptId) {
      const existingReceipt = await Receipt.findById(order.receiptId);
      if (existingReceipt) {
        return existingReceipt;
      }
    }

    const business = await Business.findById(businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    const receiptCount = await Receipt.countDocuments({ businessId });
    const receiptNumber = `RCP-${Date.now()}-${receiptCount + 1}`;

    const receipt = await Receipt.create({
      orderId: order._id,
      businessId,
      receiptNumber,
      customerName: order.customerName,
      customerContact: order.customerContact,
      items: order.items.map(item => ({
        materialName: item.materialName,
        quantity: item.quantity,
        unit: item.unit
      })),
      completedAt: order.completedAt || order.deliveredAt!,
      deliveredAt: order.deliveredAt!,
      generatedBy: userId
    });

    order.receiptId = receipt._id;
    await order.save();

    try {
      const pdfBuffer = await this.generateReceiptPDF(receipt, order, business);
      const pdfUrl = await uploadToCloudinary(pdfBuffer, `receipts/${businessId}`);

      receipt.pdfUrl = pdfUrl;
      await receipt.save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }

    return receipt;
  }

  private static async generateReceiptPDF(
    receipt: IReceipt,
    order: any,
    business: any
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text(business.name, { align: "center" });
      doc.fontSize(10).text(business.location || "", { align: "center" });
      doc.fontSize(10).text(business.contactPhone || "", { align: "center" });
      doc.moveDown();

      doc.fontSize(16).text("DELIVERY RECEIPT", { align: "center", underline: true });
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Receipt Number: ${receipt.receiptNumber}`);
      doc.text(`Order Number: ${order.orderNumber}`);
      doc.text(`Customer Name: ${receipt.customerName || "N/A"}`);
      doc.text(`Customer Contact: ${receipt.customerContact || "N/A"}`);
      doc.text(`Delivered Date: ${receipt.deliveredAt.toLocaleDateString()}`);
      doc.moveDown();

      doc.fontSize(14).text("Items:", { underline: true });
      doc.moveDown(0.5);

      let y = doc.y;
      const tableTop = y;
      const col1X = 50;
      const col2X = 300;
      const col3X = 450;

      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Item", col1X, tableTop);
      doc.text("Quantity", col2X, tableTop);
      doc.text("Unit", col3X, tableTop);

      doc.moveTo(col1X, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      y = tableTop + 25;
      doc.font("Helvetica");

      receipt.items.forEach((item) => {
        doc.text(item.materialName, col1X, y);
        doc.text(item.quantity.toString(), col2X, y);
        doc.text(item.unit, col3X, y);
        y += 20;
      });

      doc.moveDown(2);
      doc.fontSize(10).text(
        `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        { align: "center" }
      );

      doc.end();
    });
  }

  static async getReceipt(
    receiptId: mongoose.Types.ObjectId,
    businessId: mongoose.Types.ObjectId
  ): Promise<IReceipt | null> {
    return await Receipt.findOne({ _id: receiptId, businessId })
      .populate("orderId")
      .populate("generatedBy", "name email");
  }

  static async getReceiptByOrderId(
    orderId: mongoose.Types.ObjectId,
    businessId: mongoose.Types.ObjectId
  ): Promise<IReceipt | null> {
    return await Receipt.findOne({ orderId, businessId })
      .populate("generatedBy", "name email");
  }

  static async listReceipts(
    businessId: mongoose.Types.ObjectId,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ receipts: IReceipt[]; total: number }> {
    const receipts = await Receipt.find({ businessId })
      .populate("orderId", "orderNumber")
      .populate("generatedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await Receipt.countDocuments({ businessId });

    return { receipts, total };
  }
}
