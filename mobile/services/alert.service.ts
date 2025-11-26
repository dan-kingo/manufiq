import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface Alert {
  _id: string;
  businessId: string;
  itemId: {
    _id: string;
    name: string;
    sku?: string;
    quantity: number;
    unit: string;
  };
  type: 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'critical';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentQuantity: number;
  threshold: number;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

class AlertService {
  async getAlerts(includeResolved: boolean = false): Promise<{ alerts: Alert[] }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ALERTS.LIST, {
      params: { includeResolved },
    });
  }

  async resolveAlert(id: string): Promise<{ message: string; alert: Alert }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.ALERTS.RESOLVE(id));
  }

  async triggerThresholdCheck(): Promise<{ message: string }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.ALERTS.CHECK);
  }
}

export default new AlertService();
