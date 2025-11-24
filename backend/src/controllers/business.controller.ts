import { Request, Response } from "express";
import { Business } from "../models/Business.js";
import { User } from "../models/User.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { translateObject } from "../services/translate.service.js";

export class BusinessController {
  // GET /business/:id
  static async getBusiness(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { lang } = req.query;

      const business = await Business.findById(id);
      if (!business) return res.status(404).json({ error: "Business not found" });

      // If language is specified and different from business language, translate
      if (lang && lang !== business.language) {
        const translatedBusiness = await translateObject(
          business.toObject(),
          lang as "en" | "am" | "om",
          ["name", "location"]
        );
        return res.json(translatedBusiness);
      }

      return res.json(business);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch business" });
    }
  }

  // PUT /business/:id
  static async updateBusiness(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Verify user owns this business
      const user = await User.findById(userId);
      if (!user || user.businessId?.toString() !== id) {
        return res.status(403).json({ error: "Unauthorized to update this business" });
      }

      const business = await Business.findById(id);
      if (!business) return res.status(404).json({ error: "Business not found" });

      const {
        name,
        location,
        contactPhone,
        language
      } = req.body;

      // Update allowed fields
      if (name !== undefined) business.name = name;
      if (location !== undefined) business.location = location;
      if (contactPhone !== undefined) business.contactPhone = contactPhone;
      if (language !== undefined) business.language = language;

      await business.save();

      return res.json({
        message: "Business updated successfully",
        business
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update business" });
    }
  }

  // POST /business/:id/doc
  static async uploadDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Verify user owns this business
      const user = await User.findById(userId);
      if (!user || user.businessId?.toString() !== id) {
        return res.status(403).json({ error: "Unauthorized to upload to this business" });
      }

      const business = await Business.findById(id);
      if (!business) return res.status(404).json({ error: "Business not found" });

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to Cloudinary
      const fileUrl = await uploadToCloudinary(
        req.file.buffer,
        `business-docs/${id}`
      );

      // Add to business verification docs
      business.verificationDocs.push(fileUrl);
      await business.save();

      return res.json({
        message: "Document uploaded successfully",
        fileUrl,
        business
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to upload document" });
    }
  }

  // GET /business/:id/settings
  static async getSettings(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Verify user owns this business
      const user = await User.findById(userId);
      if (!user || user.businessId?.toString() !== id) {
        return res.status(403).json({ error: "Unauthorized to view this business settings" });
      }

      const business = await Business.findById(id).select(
        "language contactPhone verificationDocs"
      );

      if (!business) return res.status(404).json({ error: "Business not found" });

      return res.json({
        language: business.language,
        contactPhone: business.contactPhone,
        verificationDocs: business.verificationDocs
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  }
}
