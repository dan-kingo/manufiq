import apiService from './api.service';
import { API_CONFIG } from '../constants/config';
import * as SecureStore from 'expo-secure-store';

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  businessName: string;
  language?: 'en' | 'am' | 'om';
}

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'staff' | 'admin';
  businessId?: string;
  isVerified: boolean;
}

class AuthService {
  async register(data: RegisterData): Promise<{ message: string; user: User }> {
    const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data);
    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data);

    await SecureStore.setItemAsync('accessToken', response.accessToken);
    await SecureStore.setItemAsync('refreshToken', response.refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(response.user));

    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (refreshToken) {
      try {
        await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
  }

  async getCurrentUser(): Promise<User | null> {
    const userStr = await SecureStore.getItemAsync('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('accessToken');
    return !!token;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
    });
  }
}

export default new AuthService();
