import notificationService from '../services/notification.service';
import { NotificationType } from '../models/notification.model';

/**
 * Helper to create admin notifications when events occur.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function notify(
  type: NotificationType,
  title: string,
  message: string,
  link = '',
  metadata: Record<string, unknown> = {},
) {
  try {
    await notificationService.create({ type, title, message, link, metadata });
  } catch (err) {
    console.error('[Notification] Failed to create:', err);
  }
}

export const notifyOrder = (orderNumber: string, amount: number, orderId: string) =>
  notify('order', 'New Order Placed', `Order #${orderNumber} — Rs.${amount.toLocaleString('en-IN')}`, `/orders/${orderId}`, { orderId, orderNumber });

export const notifyContact = (name: string, subject: string, contactId: string) =>
  notify('contact', 'New Contact Message', `${name}: ${subject}`, `/contact-messages`, { contactId });

export const notifyServiceRequest = (name: string, type: string, requestId: string) =>
  notify('service_request', 'New Service Request', `${name} — ${type}`, `/service-requests`, { requestId });

export const notifyKyc = (userName: string, userId: string) =>
  notify('kyc', 'KYC Submitted', `${userName} submitted KYC for verification`, `/users`, { userId });

export const notifyReview = (productName: string, rating: number, userName: string) =>
  notify('review', 'New Review', `${userName} rated "${productName}" ${rating}/5`, `/reviews`, { productName, rating });

export const notifyLowStock = (productName: string, stock: number, productId: string) =>
  notify('low_stock', 'Low Stock Alert', `"${productName}" has only ${stock} units left`, `/products`, { productId });
