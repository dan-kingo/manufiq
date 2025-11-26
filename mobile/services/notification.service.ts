import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface Notification {
  _id: string;
  userId: string;
  businessId: string;
  alertId?: string;
  type: 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'critical' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  channels: ('push' | 'email' | 'in_app')[];
  sentVia: ('push' | 'email' | 'in_app')[];
  createdAt: string;
}

class NotificationService {
  async registerDevice(token: string, platform: 'ios' | 'android' | 'web', deviceId?: string): Promise<{ message: string }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.DEVICES.REGISTER, {
      token,
      platform,
      deviceId,
    });
  }

  async getNotifications(limit?: number, includeRead?: boolean): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST, {
      params: { limit, includeRead },
    });
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  }

  async markAsRead(id: string): Promise<{ message: string; notification: Notification }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  }

  async markAllAsRead(): Promise<{ message: string; count: number }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }

  async deleteNotification(id: string): Promise<{ message: string }> {
    return await apiService.delete(API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(id));
  }
}

export default new NotificationService();
