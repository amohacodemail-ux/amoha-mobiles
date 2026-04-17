export interface IActivityLog {
  _id?: string;
  id?: string;
  userId: string;
  user?: any;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: { field: string; oldValue: string; newValue: string; }[];
  createdAt?: Date;
}

export const ACTIVITY_LOG_TABLE = 'activity_logs';
