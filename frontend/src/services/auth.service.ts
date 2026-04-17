import apiClient from '@/lib/api-client';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  ApiResponse,
} from '@/types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials,
    );
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/register',
      credentials,
    );
    return data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const { data } = await apiClient.post<ApiResponse>('/auth/forgot-password', {
      email,
    });
    return data;
  },

  resetPassword: async (
    token: string,
    password: string,
  ): Promise<ApiResponse> => {
    const { data } = await apiClient.post<ApiResponse>('/auth/reset-password', {
      token,
      password,
    });
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return data.data;
  },

  updateProfile: async (
    updates: Partial<Pick<User, 'name' | 'phone' | 'avatar'>>,
  ): Promise<User> => {
    const { data } = await apiClient.put<ApiResponse<User>>(
      '/auth/profile',
      updates,
    );
    return data.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse> => {
    const { data } = await apiClient.put<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};
