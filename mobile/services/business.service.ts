import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface Business {
  _id: string;
  name: string;
  location?: string;
  contactPhone?: string;
  language: 'en' | 'am' | 'om';
  verificationDocs: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSettings {
  language: 'en' | 'am' | 'om';
  contactPhone?: string;
  verificationDocs: string[];
}

class BusinessService {
  async getBusiness(id: string, lang?: 'en' | 'am' | 'om'): Promise<Business> {
    return await apiService.get(API_CONFIG.ENDPOINTS.BUSINESS.GET(id), {
      params: lang ? { lang } : undefined,
    });
  }

  async updateBusiness(id: string, data: {
    name?: string;
    location?: string;
    contactPhone?: string;
    language?: 'en' | 'am' | 'om';
  }): Promise<{ message: string; business: Business }> {
    return await apiService.put(API_CONFIG.ENDPOINTS.BUSINESS.UPDATE(id), data);
  }

  async uploadDocument(id: string, file: any): Promise<{ message: string; fileUrl: string; business: Business }> {
    const formData = new FormData();
    formData.append('document', file);

    return await apiService.post(API_CONFIG.ENDPOINTS.BUSINESS.UPLOAD_DOC(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getSettings(id: string): Promise<BusinessSettings> {
    return await apiService.get(API_CONFIG.ENDPOINTS.BUSINESS.SETTINGS(id));
  }
}

export default new BusinessService();
