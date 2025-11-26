import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface SyncOperation {
  opId: string;
  type: 'adjust' | 'create' | 'update' | 'delete';
  entityType?: 'item' | 'tag' | 'business';
  payload: Record<string, any>;
  clientTimestamp?: string;
}

export interface SyncResult {
  opId: string;
  status: 'applied' | 'conflict' | 'failed';
  appliedAt: string;
  serverData?: any;
  error?: string;
  conflictReason?: string;
}

class SyncService {
  async push(operations: SyncOperation[]): Promise<{ serverTime: string; results: SyncResult[]; message: string }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.SYNC.PUSH, { operations });
  }

  async pull(since: string): Promise<{ serverTime: string; operations: any[]; count: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.SYNC.PULL, {
      params: { since },
    });
  }

  async getConflicts(limit?: number): Promise<{ conflicts: any[]; count: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.SYNC.CONFLICTS, {
      params: { limit },
    });
  }

  async getStatus(): Promise<{ serverTime: string; businessId: string; userId: string; message: string }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.SYNC.STATUS);
  }

  async deduplicate(): Promise<{ message: string; removedCount: number }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.SYNC.DEDUPLICATE);
  }

  async cleanup(days: number = 30): Promise<{ message: string; removedCount: number }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.SYNC.CLEANUP, null, {
      params: { days },
    });
  }
}

export default new SyncService();
