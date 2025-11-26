import apiService from './api.service';

export interface Staff {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'staff';
  businessId: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  phone: string;
  password: string;
  provider?: 'local' | 'google';
}

export interface UpdateStaffData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  provider?: 'local' | 'google';
  isVerified?: boolean;
}

class StaffService {
  async getStaff(): Promise<{ staff: Staff[] }> {
    return await apiService.get('/api/owner/staff');
  }

  async createStaff(data: CreateStaffData): Promise<{ message: string; staff: Staff }> {
    return await apiService.post('/api/owner/staff', data);
  }

  async updateStaff(id: string, data: UpdateStaffData): Promise<{ message: string; staff: Staff }> {
    return await apiService.put(`/api/owner/staff/${id}`, data);
  }

  async deleteStaff(id: string): Promise<{ message: string }> {
    return await apiService.delete(`/api/owner/staff/${id}`);
  }

  async suspendUser(id: string, reason?: string): Promise<{ message: string; user: any }> {
    return await apiService.post(`/api/owner/users/${id}/suspend`, { reason });
  }

  async unsuspendUser(id: string): Promise<{ message: string; user: any }> {
    return await apiService.post(`/api/owner/users/${id}/unsuspend`);
  }
}

export default new StaffService();
