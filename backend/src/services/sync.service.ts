import mongoose from "mongoose";
import { SyncOp, ISyncOp } from "../models/SyncOp.js";
import { Business } from "../models/Business.js";
import { InventoryEvent } from "../models/InventoryEvent.js";
import { AlertService } from "./alert.service.js";
import { Material } from "../models/Material.js";

interface ClientOperation {
  opId: string;
  type: "adjust" | "create" | "update" | "delete";
  entityType?: "material" | "business";
  payload: Record<string, any>;
  clientTimestamp?: string | Date;
}

interface AppliedOperation {
  opId: string;
  status: "applied" | "conflict" | "failed";
  appliedAt: Date;
  serverData?: any;
  error?: string;
  conflictReason?: string;
}

export class SyncService {
  static async applyOperations(
    operations: ClientOperation[],
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<AppliedOperation[]> {
    const results: AppliedOperation[] = [];

    for (const op of operations) {
      try {
        const existingOp = await SyncOp.findOne({ opId: op.opId });

        if (existingOp) {
          results.push({
            opId: op.opId,
            status: existingOp.status as "applied" | "conflict" | "failed",
            appliedAt: existingOp.appliedAt,
            serverData: existingOp.payload
          });
          continue;
        }

        const result = await this.applyOperation(op, businessId, userId);
        results.push(result);
      } catch (err: any) {
        console.error(`Failed to apply operation ${op.opId}:`, err);

        await SyncOp.create({
          opId: op.opId,
          businessId,
          userId,
          type: op.type,
          entityType: op.entityType || "material",
          payload: op.payload,
          clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
          appliedAt: new Date(),
          source: "client",
          status: "failed",
          conflictReason: err.message
        });

        results.push({
          opId: op.opId,
          status: "failed",
          appliedAt: new Date(),
          error: err.message
        });
      }
    }

    return results;
  }

  private static async applyOperation(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<AppliedOperation> {
    const entityType = op.entityType || "material";

    switch (op.type) {
      case "adjust":
        return await this.applyAdjustment(op, businessId, userId);
      case "create":
        return await this.applyCreate(op, businessId, userId, entityType);
      case "update":
        return await this.applyUpdate(op, businessId, userId, entityType);
      case "delete":
        return await this.applyDelete(op, businessId, userId, entityType);
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  private static async applyAdjustment(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<AppliedOperation> {
    const { materialId, delta, action, reason } = op.payload;

    if (!materialId || delta === undefined) {
      throw new Error("materialId and delta are required for adjust operations");
    }

    const material = await Material.findOne({
      _id: materialId,
      businessId
    });

    if (!material) {
      throw new Error("Material not found");
    }

    const newQuantity = material.quantity + delta;

    if (newQuantity < 0) {
      const syncOp = await SyncOp.create({
        opId: op.opId,
        businessId,
        userId,
        type: op.type,
        entityType: "item",
        payload: op.payload,
        clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
        appliedAt: new Date(),
        source: "client",
        status: "conflict",
        conflictReason: "Insufficient quantity",
        materialId: material._id
      });

      return {
        opId: op.opId,
        status: "conflict",
        appliedAt: syncOp.appliedAt,
        conflictReason: "Insufficient quantity",
        serverData: { quantity: material.quantity }
      };
    }

    material.quantity = newQuantity;
    await material.save();

    await InventoryEvent.create({
      materialId: material._id,
      businessId,
      userId,
      delta,
      action: action || "adjusted",
      reason: reason || "Sync operation"
    });

    await AlertService.checkMaterialThreshold(material._id, businessId, newQuantity);

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType: "material",
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      materialId: material._id
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt,
      serverData: {
        materialId: material._id,
        quantity: material.quantity,
        updatedAt: material.updatedAt
      }
    };
  }

  private static async applyCreate(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    entityType: "material" | "business"
  ): Promise<AppliedOperation> {
    let createdEntity: any;
    let entityId: mongoose.Types.ObjectId;

    switch (entityType) {
      case "material":
        const { quantity, ...restPayload } = op.payload as any;
        const materialData = {
          ...restPayload,
          businessId,
          quantity
        };
        createdEntity = await Material.create(materialData);
        entityId = createdEntity._id;

        const initialQuantity = typeof quantity === "number" ? quantity : (quantity ? Number(quantity) : 0);

        if (initialQuantity > 0) {
          await InventoryEvent.create({
            materialId: createdEntity._id,
            businessId,
            userId,
            delta: initialQuantity,
            action: "added",
            reason: "Initial stock (sync)"
          });
        }
        break;
      default:
        throw new Error(`Create operation not supported for entity type: ${entityType}`);
    }

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType,
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      materialId: entityType === "material" ? entityId : undefined
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt,
      serverData: createdEntity.toObject()
    };
  }

  private static async applyUpdate(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    entityType: "material" | "business"
  ): Promise<AppliedOperation> {
    const { _id, ...updateData } = op.payload;

    if (!_id) {
      throw new Error("_id is required for update operations");
    }

    let entity: any;
    let Model: any;

    switch (entityType) {
      case "material":
        Model = Material;
        break;
      case "business":
        Model = Business;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    entity = await Model.findOne({ _id, businessId });

    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    const serverTimestamp = entity.updatedAt;
    const clientTimestamp = op.clientTimestamp ? new Date(op.clientTimestamp) : null;

    if (clientTimestamp && serverTimestamp > clientTimestamp) {
      const syncOp = await SyncOp.create({
        opId: op.opId,
        businessId,
        userId,
        type: op.type,
        entityType,
        payload: op.payload,
        clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
        appliedAt: new Date(),
        source: "client",
        status: "conflict",
        conflictReason: "Server has newer data (last-write-wins)",
        materialId: entityType === "material" ? entity._id : undefined
      });

      return {
        opId: op.opId,
        status: "conflict",
        appliedAt: syncOp.appliedAt,
        conflictReason: "Server has newer data",
        serverData: entity.toObject()
      };
    }

    Object.assign(entity, updateData);
    await entity.save();

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType,
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      markModified: entityType === "material" ? entity._id : undefined
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt,
      serverData: entity.toObject()
    };
  }

  private static async applyDelete(
    op: ClientOperation,
    businessId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    entityType: "material" | "business"
  ): Promise<AppliedOperation> {
    const { _id } = op.payload;

    if (!_id) {
      throw new Error("_id is required for delete operations");
    }

    let Model: any;

    switch (entityType) {
      case "material":
        Model = Material;
        break;
      default:
        throw new Error(`Delete operation not supported for entity type: ${entityType}`);
    }

    const entity = await Model.findOne({ _id, businessId });

    if (!entity) {
      const syncOp = await SyncOp.create({
        opId: op.opId,
        businessId,
        userId,
        type: op.type,
        entityType,
        payload: op.payload,
        clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
        appliedAt: new Date(),
        source: "client",
        status: "applied"
      });

      return {
        opId: op.opId,
        status: "applied",
        appliedAt: syncOp.appliedAt
      };
    }

    await entity.deleteOne();

    const syncOp = await SyncOp.create({
      opId: op.opId,
      businessId,
      userId,
      type: op.type,
      entityType,
      payload: op.payload,
      clientTimestamp: op.clientTimestamp ? new Date(op.clientTimestamp) : undefined,
      appliedAt: new Date(),
      source: "client",
      status: "applied",
      materialId: entityType === "material" ? entity._id : undefined
    });

    return {
      opId: op.opId,
      status: "applied",
      appliedAt: syncOp.appliedAt
    };
  }

  static async getOperationsSince(
    businessId: mongoose.Types.ObjectId,
    sinceTimestamp: Date
  ): Promise<ISyncOp[]> {
    const operations = await SyncOp.find({
      businessId,
      appliedAt: { $gt: sinceTimestamp },
      status: "applied"
    })
      .sort({ appliedAt: 1 })
      .lean();

    return operations as unknown as ISyncOp[];
  }

  static async deduplicateOperations(businessId: mongoose.Types.ObjectId): Promise<number> {
    const duplicates = await SyncOp.aggregate([
      { $match: { businessId } },
      { $group: { _id: "$opId", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    let removedCount = 0;

    for (const dup of duplicates) {
      const [keep, ...remove] = dup.ids;
      await SyncOp.deleteMany({ _id: { $in: remove } });
      removedCount += remove.length;
    }

    return removedCount;
  }

  static async cleanupOldOperations(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await SyncOp.deleteMany({
      appliedAt: { $lt: cutoffDate }
    });

    return result.deletedCount || 0;
  }

  static async getConflictLog(
    businessId: mongoose.Types.ObjectId,
    limit: number = 100
  ): Promise<ISyncOp[]> {
    const conflicts = await SyncOp.find({
      businessId,
      status: "conflict"
    })
      .sort({ appliedAt: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .populate("itemId", "name sku")
      .lean();

    return conflicts as unknown as ISyncOp[];
  }
}
