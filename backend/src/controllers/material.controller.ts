import { Request, Response } from "express";
import { Material } from "../models/Material.js";
import { InventoryEvent } from "../models/InventoryEvent.js";
import { User } from "../models/User.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { AlertService } from "../services/alert.service.js";
import crypto from "crypto";
import QRCode from "qrcode";

export class MaterialController {
 static async createMaterial(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const {
      name,
      sku,
      description,
      quantity,
      unit,
      category,
      location,
      minThreshold,
      expiryDate
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Material name is required" });
    }

    const user = await User.findById(userId);
    if (!user || !user.businessId) {
      return res.status(403).json({ error: "User must belong to a business" });
    }

    const businessId = user.businessId;

    let imageUrl;
    if (req.file) {
      imageUrl = await uploadToCloudinary(
        req.file.buffer,
        `materials/${businessId}`
      );
    }

    /** 🔥 Create material */
    const material = await Material.create({
      businessId,
      name,
      sku,
      description,
      quantity: quantity || 0,
      unit: unit || "pcs",
      category,
      location,
      minThreshold: minThreshold || 0,
      image: imageUrl,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });


    /** Create initial event */
    if (quantity && quantity > 0) {
      await InventoryEvent.create({
        materialId: material._id,
        businessId,
        userId,
        delta: quantity,
        action: "added",
        reason: "Initial stock"
      });
    }

    await AlertService.checkMaterialThreshold(material._id, businessId, material.quantity);


    /** 🔥 RETURN item + tagId + QR Code */
    return res.status(201).json({
      message: "Item created successfully",
      material,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unable to create item. Please try again." });
  }
}

  static async listMaterials(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { category, lowStock } = req.query;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const filter: any = { businessId: user.businessId };

      if (category) {
        filter.category = category;
      }

      if (lowStock === "true") {
        filter.$expr = { $lte: ["$quantity", "$minThreshold"] };
      }

      const materials = await Material.find(filter).sort({ createdAt: -1 });

      return res.json(materials);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to load items. Please try again." });
    }
  }

  static async getMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const material = await Material.findOne({ _id: id, businessId: user.businessId });

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      return res.json(material);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to load item details. Please try again." });
    }
  }

  static async updateMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const material = await Material.findOne({ _id: id, businessId: user.businessId });

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const {
        name,
        sku,
        description,
        unit,
        category,
        location,
        minThreshold,
        expiryDate
      } = req.body;

      if (name !== undefined) material.name = name;
      if (sku !== undefined) material.sku = sku;
      if (description !== undefined) material.description = description;
      if (unit !== undefined) material.unit = unit;
      if (category !== undefined) material.category = category;
      if (location !== undefined) material.location = location;
      if (minThreshold !== undefined) material.minThreshold = minThreshold;
      if (expiryDate !== undefined) {
        material.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
      }

      if (req.file) {
        const imageUrl = await uploadToCloudinary(
          req.file.buffer,
          `materials/${user.businessId}`
        );
        material.image = imageUrl;
      }

    
      await material.save();

      return res.json({
        message: "Material updated successfully",
        material
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to update item. Please try again." });
    }
  }

  static async adjustQuantity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { delta, action, reason } = req.body;

      if (delta === undefined || !action) {
        return res.status(400).json({ error: "Delta and action are required" });
      }

      if (!["added", "sold", "used", "adjusted"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const material = await Material.findOne({ _id: id, businessId: user.businessId });

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const newQuantity = material.quantity + delta;

      if (newQuantity < 0) {
        return res.status(400).json({ error: "Insufficient quantity" });
      }

      material.quantity = newQuantity;
      await material.save();

      await InventoryEvent.create({
        materialId: material._id,
        businessId: user.businessId,
        userId,
        delta,
        action,
        reason
      });

      await AlertService.checkMaterialThreshold(material._id, user.businessId, newQuantity);

      return res.json({
        message: "Quantity adjusted successfully",
        material
      });
    } catch (err: any) {
      if (err.name === "VersionError") {
        return res.status(409).json({ error: "Concurrent update detected. Please retry." });
      }
      console.error(err);
      return res.status(500).json({ error: "Unable to adjust quantity. Please try again." });
    }
  }

  static async getMaterialEvents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user || !user.businessId) {
        return res.status(403).json({ error: "User must belong to a business" });
      }

      const material = await Material.findOne({ _id: id, businessId: user.businessId });

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const events = await InventoryEvent.find({ materialId: id })
        .populate("userId", "name email")
        .sort({ timestamp: -1 });

      return res.json(events);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to load item history. Please try again." });
    }
  }
}
