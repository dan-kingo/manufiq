import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface OrderItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: 'pcs' | 'kg' | 'ltr';
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Order {
  _id: string;
  businessId: string;
  orderNumber: string;
  customerName?: string;
  customerContact?: string;
  items: OrderItem[];
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'halfway' | 'completed' | 'delivered' | 'cancelled';
  completionPercentage: number;
  assignedTo?: User[];
  notes?: string;
  createdBy: User;
  cancelledBy?: User;
  cancelledAt?: string;
  cancellationReason?: string;
  completedAt?: string;
  deliveredAt?: string;
  receiptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  customerName?: string;
  customerContact?: string;
  items: {
    materialId: string;
    quantity: number;
  }[];
  dueDate: string;
  notes?: string;
  assignedTo?: string[];
}

export interface UpdateOrderData {
  customerName?: string;
  customerContact?: string;
  items?: {
    materialId: string;
    quantity: number;
  }[];
  dueDate?: string;
  notes?: string;
}

export interface OrderStats {
  statusCounts: {
    not_started: number;
    in_progress: number;
    halfway: number;
    completed: number;
    delivered: number;
    cancelled: number;
  };
  totalOrders: number;
  overdueOrders: number;
}

export interface OrderHistory {
  _id: string;
  orderId: string;
  businessId: string;
  userId: User;
  action: 'created' | 'edited' | 'status_changed' | 'assigned' | 'cancelled';
  previousStatus?: string;
  newStatus?: string;
  previousData?: any;
  newData?: any;
  notes?: string;
  timestamp: string;
}

class OrderService {
  async createOrder(data: CreateOrderData): Promise<{ message: string; order: Order }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.ORDERS.CREATE, data);
  }

  async listOrders(params?: {
    status?: string;
    assignedToMe?: boolean;
    dueDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number; limit: number; offset: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ORDERS.LIST, { params });
  }

  async getOrderStats(): Promise<OrderStats> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ORDERS.STATS);
  }

  async getOrder(id: string): Promise<Order> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ORDERS.GET(id));
  }

  async updateOrder(id: string, data: UpdateOrderData): Promise<{ message: string; order: Order }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.ORDERS.UPDATE(id), data);
  }

  async updateOrderStatus(id: string, status: string): Promise<{ message: string; order: Order }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status });
  }

  async assignStaff(id: string, staffIds: string[]): Promise<{ message: string; order: Order }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.ORDERS.ASSIGN_STAFF(id), { staffIds });
  }

  async cancelOrder(id: string, reason?: string): Promise<{ message: string; order: Order }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.ORDERS.CANCEL(id), { reason });
  }

  async getOrderHistory(id: string): Promise<OrderHistory[]> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ORDERS.HISTORY(id));
  }
}

export default new OrderService();
