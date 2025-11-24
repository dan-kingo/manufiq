import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import mongoose from "mongoose";
import { DeviceToken } from "../models/DeviceToken.js";
import { Notification, INotification } from "../models/Notification.js";
import { IUser } from "../models/User.js";
import { sendEmailNotification } from "./mail.service.js"; // ✅ Now using Nodemailer

const expo = new Expo();

export class NotificationService {
  static async registerDeviceToken(
    userId: mongoose.Types.ObjectId | string,
    token: string,
    platform: "ios" | "android" | "web",
    deviceId?: string
  ): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error("Invalid Expo push token");
    }

    const existing = await DeviceToken.findOne({ token });

    if (existing) {
      existing.userId = userId as any;
      existing.platform = platform;
      existing.deviceId = deviceId;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      await existing.save();
    } else {
      await DeviceToken.create({
        userId: userId as any,
        token,
        platform,
        deviceId,
        isActive: true,
        lastUsedAt: new Date()
      });
    }
  }

  static async sendPushNotification(
    userId: mongoose.Types.ObjectId | string,
    notification: INotification
  ): Promise<void> {
    const deviceTokens = await DeviceToken.find({
      userId,
      isActive: true
    });

    if (deviceTokens.length === 0) {
      return;
    }

    const messages: ExpoPushMessage[] = [];

    for (const deviceToken of deviceTokens) {
      if (!Expo.isExpoPushToken(deviceToken.token)) {
        console.warn(`Invalid token for device ${deviceToken._id}`);
        continue;
      }

      messages.push({
        to: deviceToken.token,
        sound: "default",
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          ...notification.data
        },
        priority: notification.type === "critical" ? "high" : "default"
      });
    }

    if (messages.length === 0) {
      return;
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const deviceToken = deviceTokens[i];

      if (ticket.status === "error") {
        console.error(`Push notification error for device ${deviceToken._id}:`, ticket.message);

        if (ticket.details?.error === "DeviceNotRegistered") {
          deviceToken.isActive = false;
          await deviceToken.save();
        }
      }
    }

    if (tickets.some(t => t.status === "ok")) {
      if (!notification.sentVia.includes("push")) {
        notification.sentVia.push("push");
        await notification.save();
      }
    }
  }

  static async sendEmailNotification(
    user: IUser,
    notification: INotification
  ): Promise<void> {
    if (!user.email) {
      return;
    }

    try {
      // Generate email HTML based on notification type
      const emailHtml = this.generateNotificationEmail(notification);

      // ✅ Using Nodemailer now
      await sendEmailNotification(
        user.email, 
        `🔔 ${notification.title}`,
        emailHtml
      );

      if (!notification.sentVia.includes("email")) {
        notification.sentVia.push("email");
        await notification.save();
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  }

  private static generateNotificationEmail(notification: INotification): string {
    // ... keep your existing generateNotificationEmail method unchanged
    // (the same HTML template code you had before)
    const baseStyles = `
      <style>
        .notification-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .notification-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; color: white; }
        .notification-content { padding: 30px; background: #f9f9f9; }
        .notification-details { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
        .notification-footer { background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        .priority-high { border-left-color: #e74c3c; }
        .priority-medium { border-left-color: #f39c12; }
        .priority-low { border-left-color: #27ae60; }
        .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
      </style>
    `;

    let priorityClass = "priority-medium";
    if (notification.type === "critical") priorityClass = "priority-high";
    if (notification.type === "system") priorityClass = "priority-low";

    let detailsHtml = "";
    if (notification.data) {
      const details = [];
      
      if (notification.data.itemName) {
        details.push(`<li><strong>Item:</strong> ${notification.data.itemName}</li>`);
      }
      if (notification.data.currentQuantity !== undefined) {
        details.push(`<li><strong>Current Quantity:</strong> ${notification.data.currentQuantity} ${notification.data.unit || ""}</li>`);
      }
      if (notification.data.threshold !== undefined) {
        details.push(`<li><strong>Threshold:</strong> ${notification.data.threshold} ${notification.data.unit || ""}</li>`);
      }
      if (notification.data.businessName) {
        details.push(`<li><strong>Business:</strong> ${notification.data.businessName}</li>`);
      }
      if (notification.data.expiryDate) {
        details.push(`<li><strong>Expiry Date:</strong> ${new Date(notification.data.expiryDate).toLocaleDateString()}</li>`);
      }

      if (details.length > 0) {
        detailsHtml = `
          <div class="notification-details ${priorityClass}">
            <h3 style="margin-top: 0; color: #333;">Notification Details:</h3>
            <ul style="color: #666; line-height: 1.6;">
              ${details.join('')}
            </ul>
          </div>
        `;
      }
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>${baseStyles}</head>
        <body>
          <div class="notification-container">
            <div class="notification-header">
              <h1 style="margin: 0; font-size: 24px;">Invenza Alert</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Inventory Management System</p>
            </div>
            
            <div class="notification-content">
              <h2 style="color: #333; margin-bottom: 15px;">${notification.title}</h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">${notification.message}</p>
              
              ${detailsHtml}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}" class="btn">
                  View in Dashboard
                </a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>Note:</strong> This is an automated alert from your Invenza inventory management system.
                </p>
              </div>
            </div>
            
            <div class="notification-footer">
              <p style="margin: 0;">&copy; 2024 Invenza. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">
                <a href="${process.env.FRONTEND_URL}/notifications" style="color: #667eea; text-decoration: none;">
                  Manage Notification Preferences
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // ... keep the rest of your NotificationService methods unchanged
  static async sendBulkNotifications(
    users: IUser[],
    notificationData: Partial<INotification>
  ): Promise<void> {
    for (const user of users) {
      try {
        const notification = await Notification.create({
          ...notificationData,
          userId: user._id
        });

        await this.sendPushNotification(user._id, notification);
        await this.sendEmailNotification(user, notification);

      } catch (error) {
        console.error(`Error sending notification to user ${user._id}:`, error);
      }
    }
  }

  static async getUserNotifications(
    userId: mongoose.Types.ObjectId | string,
    limit: number = 50,
    includeRead: boolean = false
  ): Promise<INotification[]> {
    const filter: any = { userId };

    if (!includeRead) {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("alertId");

    return notifications;
  }

  static async markAsRead(
    notificationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId | string
  ): Promise<INotification | null> {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) return null;

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  static async markAllAsRead(userId: mongoose.Types.ObjectId | string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return result.modifiedCount || 0;
  }

  static async deleteNotification(
    notificationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId | string
  ): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId
    });

    return result.deletedCount === 1;
  }

  static async getUnreadCount(userId: mongoose.Types.ObjectId | string): Promise<number> {
    return await Notification.countDocuments({
      userId,
      isRead: false
    });
  }
}