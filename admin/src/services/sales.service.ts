/**
 * Sales Module API Service
 * AMOHA Mobiles Admin Panel
 * All requests are authenticated server-side; userId is NEVER sent from frontend.
 */
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

// ====================== TYPES ======================

export interface DailyActivity {
  _id: string;
  userId: string;
  activityDate: string;
  customerName: string;
  visitType: 'productive' | 'non_productive' | 'office' | 'travel' | 'other';
  location: string;
  notes: string;
  status: 'completed' | 'pending' | 'cancelled';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  productsDemoed: string;
  orderValue: number;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface TourPlan {
  _id: string;
  userId: string;
  planDate: string;
  title: string;
  areas: string;
  plannedVisits: number;
  completedVisits: number;
  notes: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface SalesTarget {
  _id: string;
  userId: string;
  month: number;
  year: number;
  targetAmount: number;
  achievedAmount: number;
  targetCount: number;
  achievedCount: number;
  notes: string;
  user?: { id: string; name: string; email: string };
}

export interface Expense {
  _id: string;
  userId: string;
  expenseDate: string;
  category: 'travel' | 'food' | 'accommodation' | 'mobile' | 'stationary' | 'entertainment' | 'other';
  amount: number;
  description: string;
  receiptUrl: string;
  travelMode: string;
  distanceKm: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  remarks?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: string;
  locationCheckIn: string;
  locationCheckOut: string;
  checkinLatitude?: number | null;
  checkinLongitude?: number | null;
  checkoutLatitude?: number | null;
  checkoutLongitude?: number | null;
  status: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday';
  notes: string;
  user?: { id: string; name: string; email: string };
}

export interface LeaveRequest {
  _id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  leaveType: 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'emergency' | 'other';
  reason: string;
  halfDay: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

// ====================== DAILY ACTIVITIES ======================

export const dailyActivityService = {
  getAll: async (params: { page?: number; limit?: number; date?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    if (params.date) p.set('date', params.date);
    const { data } = await apiClient.get<ApiResponse<{ activities: DailyActivity[]; total: number; totalPages: number; currentPage: number }>>(`/sales/daily-activities?${p}`);
    return data.data;
  },

  create: async (payload: {
    activityDate?: string;
    customerName?: string;
    visitType?: string;
    location?: string;
    notes?: string;
    status?: string;
    productsDemoed?: string;
    orderValue?: number;
  }) => {
    const { data } = await apiClient.post<ApiResponse<DailyActivity>>('/sales/daily-activities', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<DailyActivity>) => {
    const { data } = await apiClient.patch<ApiResponse<DailyActivity>>(`/sales/daily-activities/${id}`, payload);
    return data.data;
  },

  /** Admin: approve or reject a daily activity */
  approve: async (id: string, approvalStatus: 'approved' | 'rejected', rejectionReason?: string) => {
    const { data } = await apiClient.patch<ApiResponse<DailyActivity>>(`/sales/daily-activities/${id}/approve`, { approvalStatus, rejectionReason });
    return data.data;
  },
};

// ====================== TOUR PLANS ======================

export const tourPlanService = {
  getAll: async (params: { page?: number; limit?: number } = {}) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    const { data } = await apiClient.get<ApiResponse<{ plans: TourPlan[]; total: number; totalPages: number; currentPage: number }>>(`/sales/tour-plans?${p}`);
    return data.data;
  },

  create: async (payload: {
    planDate?: string;
    title?: string;
    areas?: string;
    plannedVisits?: number;
    notes?: string;
    status?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<TourPlan>>('/sales/tour-plans', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<TourPlan>) => {
    const { data } = await apiClient.patch<ApiResponse<TourPlan>>(`/sales/tour-plans/${id}`, payload);
    return data.data;
  },

  /** Admin: approve or reject a tour plan */
  approve: async (id: string, approvalStatus: 'approved' | 'rejected', rejectionReason?: string) => {
    const { data } = await apiClient.patch<ApiResponse<TourPlan>>(`/sales/tour-plans/${id}/approve`, { approvalStatus, rejectionReason });
    return data.data;
  },
};

// ====================== TARGETS ======================

export const targetsService = {
  get: async (month?: number, year?: number) => {
    const p = new URLSearchParams();
    if (month) p.set('month', String(month));
    if (year) p.set('year', String(year));
    const { data } = await apiClient.get<ApiResponse<{ currentTarget: SalesTarget | null; yearlyTargets: SalesTarget[] }>>(`/sales/targets?${p}`);
    return data.data;
  },

  /** Admin: create or update a target for a sales user */
  create: async (payload: { userId: string; month: number; year: number; targetAmount: number; targetCount?: number; notes?: string }) => {
    const { data } = await apiClient.post<ApiResponse<SalesTarget>>('/sales/targets', payload);
    return data.data;
  },
};

// ====================== EXPENSES ======================

export const expenseService = {
  getAll: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    if (params.status) p.set('status', params.status);
    const { data } = await apiClient.get<ApiResponse<{ expenses: Expense[]; total: number; totalPages: number; currentPage: number }>>(`/sales/expenses?${p}`);
    return data.data;
  },

  create: async (payload: {
    expenseDate?: string;
    category?: string;
    amount: number;
    description?: string;
    receiptUrl?: string;
    travelMode?: string;
    distanceKm?: number;
  }) => {
    const { data } = await apiClient.post<ApiResponse<Expense>>('/sales/expenses', payload);
    return data.data;
  },

  /** Admin: approve or reject an expense */
  approve: async (id: string, approvalStatus: 'approved' | 'rejected', rejectionReason?: string) => {
    const { data } = await apiClient.patch<ApiResponse<Expense>>(`/sales/expenses/${id}/approve`, { approvalStatus, rejectionReason });
    return data.data;
  },
};

// ====================== ATTENDANCE ======================

export const attendanceService = {
  getAll: async (params: { page?: number; limit?: number } = {}) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    const { data } = await apiClient.get<ApiResponse<{ attendance: AttendanceRecord[]; total: number; totalPages: number; currentPage: number }>>(`/sales/attendance?${p}`);
    return data.data;
  },

  checkIn: async (location?: string) => {
    const { data } = await apiClient.post<ApiResponse<AttendanceRecord>>('/sales/attendance/check-in', { location });
    return data.data;
  },

  checkOut: async (location?: string) => {
    const { data } = await apiClient.patch<ApiResponse<AttendanceRecord>>('/sales/attendance/check-out', { location });
    return data.data;
  },
};

// ====================== LEAVE ======================

export const leaveService = {
  getAll: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    if (params.status) p.set('status', params.status);
    const { data } = await apiClient.get<ApiResponse<{ leaves: LeaveRequest[]; total: number; totalPages: number; currentPage: number }>>(`/sales/leaves?${p}`);
    return data.data;
  },

  apply: async (payload: {
    fromDate: string;
    toDate: string;
    leaveType?: string;
    reason: string;
    halfDay?: boolean;
  }) => {
    const { data } = await apiClient.post<ApiResponse<LeaveRequest>>('/sales/leaves', payload);
    return data.data;
  },

  /** Admin: approve or reject a leave request */
  approve: async (id: string, status: 'approved' | 'rejected', remarks?: string) => {
    const { data } = await apiClient.patch<ApiResponse<LeaveRequest>>(`/sales/leaves/${id}/status`, { status, remarks });
    return data.data;
  },
};

// ====================== GEO-TAG / GEO-FENCE ======================

export interface GeoFence {
  _id: string;
  name: string;
  description: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  assignedUserId?: string | null;
  assignedUser?: { _id: string; name: string; email: string } | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeoTag {
  _id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  address: string;
  visitType: string;
  fenceId: string | null;
  fenceName: string;
  fenceCenterLat: number | null;
  fenceCenterLng: number | null;
  fenceRadiusMeters: number | null;
  inFence: boolean | null;
  distanceMeters: number | null;
  createdAt: string;
  user?: { _id: string; name: string; email: string };
}

export interface GeoFenceValidation {
  inFence: boolean;
  fence: GeoFence | null;
  latitude: number;
  longitude: number;
  assignedFence: GeoFence | null;
  assignedInFence: boolean | null;
  distanceToAssigned: number | null;
}

export type TrackingStatus =
  | 'not_tracking'
  | 'tracking_active'
  | 'tracking_stopped'
  | 'location_permission_denied'
  | 'location_unavailable'
  | 'last_location_available';

export interface LiveLocation {
  _id: string;
  id: string;
  salespersonId: string;
  userName: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  timestamp: string;
  trackingStatus: TrackingStatus;
  geofenceStatus: 'inside' | 'outside' | null;
  distanceFromGeofence: number | null;
  fenceId?: string | null;
  fenceName?: string;
  updatedAt: string;
  user?: { _id: string; name: string; email: string } | null;
}

export const geoTagService = {
  /** Get ALL active geo-fence territories assigned to the logged-in salesperson */
  getMyFences: async (): Promise<GeoFence[]> => {
    const { data } = await apiClient.get<ApiResponse<GeoFence[]>>('/sales/geo-fences/mine');
    return data.data;
  },

  /** Save a geo-tag (GPS location). Server validates coordinates, the territory ownership, and computes fence status. */
  save: async (payload: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    address?: string;
    visitType?: string;
    fenceId?: string | null;
  }): Promise<GeoTag> => {
    const { data } = await apiClient.post<ApiResponse<GeoTag>>('/sales/geo-tags', payload);
    return data.data;
  },

  /** Get location history. Sales: own only. Admin: all, filterable by userId/date */
  getAll: async (params: { page?: number; limit?: number; userId?: string; date?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    if (params.userId) p.set('userId', params.userId);
    if (params.date) p.set('date', params.date);
    const { data } = await apiClient.get<ApiResponse<{ tags: GeoTag[]; total: number; totalPages: number; currentPage: number }>>(`/sales/geo-tags?${p}`);
    return data.data;
  },
};

export const geoFenceService = {
  /** List all active geo-fences */
  list: async (): Promise<GeoFence[]> => {
    const { data } = await apiClient.get<ApiResponse<GeoFence[]>>('/sales/geo-fences');
    return data.data;
  },

  /** Create geo-fence (admin only) */
  create: async (payload: {
    name: string;
    centerLat: number;
    centerLng: number;
    radiusMeters?: number;
    description?: string;
    assignedUserId?: string | null;
  }): Promise<GeoFence> => {
    const { data } = await apiClient.post<ApiResponse<GeoFence>>('/sales/geo-fences', payload);
    return data.data;
  },

  /** Update geo-fence (admin only) */
  update: async (id: string, payload: Partial<{
    name: string;
    centerLat: number;
    centerLng: number;
    radiusMeters: number;
    isActive: boolean;
    description: string;
    assignedUserId: string | null;
  }>): Promise<GeoFence> => {
    const { data } = await apiClient.patch<ApiResponse<GeoFence>>(`/sales/geo-fences/${id}`, payload);
    return data.data;
  },

  /** Validate current location against the logged-in salesperson's own assigned geo-fences */
  validate: async (latitude: number, longitude: number, fenceId?: string | null): Promise<GeoFenceValidation> => {
    const { data } = await apiClient.post<ApiResponse<GeoFenceValidation>>('/sales/geo-tag/validate', { latitude, longitude, fenceId });
    return data.data;
  },

  /** List sales users for the assignment dropdown (admin only). Only active (non-blocked) sales users. */
  getSalesUsers: async () => {
    const { data } = await apiClient.get<ApiResponse<{ users: { _id: string; name: string; email: string }[]; pagination: { total: number; page: number; limit: number; pages: number } }>>(`/users/all?role=sales&is_blocked=false&limit=200`);
    return data.data;
  },

  /** Delete geo-fence (admin only). Existing location history is preserved. */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales/geo-fences/${id}`);
  },
};

// ====================== LIVE TRACKING ======================

export const liveLocationService = {
  /**
   * Update the logged-in salesperson's latest live location.
   * The backend upserts a single row per salesperson (no duplicate history records).
   */
  update: async (payload: {
    latitude?: number | null;
    longitude?: number | null;
    accuracyMeters?: number | null;
    trackingStatus: TrackingStatus;
    timestamp?: string;
    fenceId?: string | null;
  }): Promise<LiveLocation> => {
    const { data } = await apiClient.post<ApiResponse<LiveLocation>>('/sales/live-location', payload);
    return data.data;
  },

  /**
   * Latest live location of every salesperson (admin) or own record (sales).
   */
  getAll: async (params: { userId?: string } = {}): Promise<LiveLocation[]> => {
    const p = new URLSearchParams();
    if (params.userId) p.set('userId', params.userId);
    const qs = p.toString();
    const { data } = await apiClient.get<ApiResponse<LiveLocation[]>>(`/sales/live-locations${qs ? `?${qs}` : ''}`);
    return data.data;
  },
};
