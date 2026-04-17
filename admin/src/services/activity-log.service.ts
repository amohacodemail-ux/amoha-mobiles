import apiClient from '@/lib/api-client';
import type { ApiResponse, ActivityLogsResponse, ActivityLog, TableFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

export const activityLogService = {
  getAll: async (filters: Partial<TableFilters> = {}): Promise<ActivityLogsResponse> => {
    const { data } = await apiClient.get<ApiResponse<ActivityLogsResponse>>(
      `/activity-logs?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  getByResource: async (resource: string, resourceId: string): Promise<ActivityLog[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/activity-logs/${resource}/${resourceId}`,
    );
    const raw = data?.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.logs) ? raw.logs : [];
  },
};
