export type NotificationType = 'order' | 'contact' | 'service_request' | 'kyc' | 'review' | 'system' | 'low_stock';

export interface INotification {
  _id?: string;
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export const NOTIFICATION_TABLE = 'notifications';
