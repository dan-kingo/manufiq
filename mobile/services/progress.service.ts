import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface ProductionStep {
  _id: string;
  orderId: string;
  businessId: string;
  stepNumber: number;
  description: string;
  isCompleted: boolean;
  completedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepsResponse {
  steps: ProductionStep[];
  totalSteps: number;
  completedSteps: number;
  completionPercentage: number;
}

export interface CreateStepsData {
  steps: {
    description?: string;
    isCompleted?: boolean;
    notes?: string;
  }[];
}

export interface UpdateStepData {
  isCompleted?: boolean;
  notes?: string;
}

export interface Receipt {
  _id: string;
  orderId: string;
  businessId: string;
  receiptNumber: string;
  customerName?: string;
  customerContact?: string;
  items: {
    materialName: string;
    quantity: number;
    unit: string;
  }[];
  completedSteps: {
    _id?: string;
    stepNumber: number;
    description: string;
    notes?: string;
    completedBy?: {
      _id: string;
      name: string;
      email: string;
    };
  }[];
  issuedBy: {
    _id: string;
    name: string;
    email: string;
  };
  issuedAt: string;
  completedAt: string;
  deliveredAt: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

class ProgressService {
  async addProductionSteps(orderId: string, data: CreateStepsData): Promise<{ message: string; steps: ProductionStep[] }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.PROGRESS.ADD_STEPS(orderId), data);
  }

  async getProductionSteps(orderId: string): Promise<StepsResponse> {
    return await apiService.get(API_CONFIG.ENDPOINTS.PROGRESS.GET_STEPS(orderId));
  }

  async updateProductionStep(stepId: string, data: UpdateStepData): Promise<{ message: string; step: ProductionStep }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.PROGRESS.UPDATE_STEP(stepId), data);
  }

  async deleteProductionStep(stepId: string): Promise<{ message: string }> {
    return await apiService.delete(API_CONFIG.ENDPOINTS.PROGRESS.DELETE_STEP(stepId));
  }

  async markOrderDelivered(orderId: string): Promise<{ message: string; order: any; receipt: Receipt }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.PROGRESS.MARK_DELIVERED(orderId));
  }

  async getReceipt(orderId: string): Promise<Receipt> {
    return await apiService.get(API_CONFIG.ENDPOINTS.PROGRESS.GET_RECEIPT(orderId));
  }

  async getReceiptById(receiptId: string): Promise<Receipt> {
    // Some backends expose receipts via /api/progress/receipts/:id
    const endpoint = `${API_CONFIG.ENDPOINTS.PROGRESS.LIST_RECEIPTS}/${receiptId}`;
    return await apiService.get(endpoint);
  }

  async listReceipts(params?: { limit?: number; offset?: number }): Promise<{ receipts: Receipt[]; total: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.PROGRESS.LIST_RECEIPTS, { params });
  }
}

export default new ProgressService();
