import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import { buildQueryString } from '@/lib/utils';

export interface Campaign {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  targetType: 'all' | 'segment';
  targetSegment?: string;
  productTargetType: 'all' | 'products' | 'category';
  productIds?: string[];
  categoryId?: string;
  couponId?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
  createdAt: string;
  coupon?: {
    id: string;
    code: string;
    discount: number;
    discountType: string;
    minOrderAmount: number;
    usageLimit: number;
  };
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  totalPages: number;
}

export const campaignService = {
  getCampaigns: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<CampaignsResponse> => {
    const { data } = await apiClient.get<ApiResponse<CampaignsResponse>>(
      `/campaigns?${buildQueryString(params)}`
    );
    return data.data;
  },

  getCampaignById: async (id: string): Promise<Campaign> => {
    const { data } = await apiClient.get<ApiResponse<Campaign>>(`/campaigns/${id}`);
    return data.data;
  },

  createCampaign: async (payload: Partial<Campaign>): Promise<Campaign> => {
    const { data } = await apiClient.post<ApiResponse<Campaign>>('/campaigns', payload);
    return data.data;
  },

  updateCampaign: async (id: string, payload: Partial<Campaign>): Promise<Campaign> => {
    const { data } = await apiClient.patch<ApiResponse<Campaign>>(`/campaigns/${id}`, payload);
    return data.data;
  },

  deleteCampaign: async (id: string): Promise<void> => {
    await apiClient.delete(`/campaigns/${id}`);
  },
};
