import supabase from '../config/supabase';
import logger from '../utils/logger.util';
import whatsappService from './whatsapp.service';
import env from '../config/env';
import { BadRequestError } from '../errors/app-error';

export interface StockNotificationTarget {
  subscriptionId?: string | null;
  userId?: string;
  phone: string;
  isTestTarget?: boolean;
}

class StockNotificationService {
  /**
   * PHASE 3 - Customer Selection
   * Find customers eligible for a restock notification for a specific product.
   */
  async getEligibleCustomersForRestock(productId: string): Promise<StockNotificationTarget[]> {
    try {
      const { data, error } = await supabase
        .from('stock_notification_subscriptions')
        .select(`
          id,
          user_id,
          phone,
          users (
            phone
          )
        `)
        .eq('product_id', productId)
        .eq('status', 'active')
        .eq('whatsapp_opt_in', true);

      if (error) {
        logger.error(`[StockNotificationService] Error fetching eligible customers for product ${productId}:`, error);
        throw error;
      }

      const targets: StockNotificationTarget[] = [];

      for (const sub of (data || [])) {
        const userPhone = Array.isArray(sub.users) ? (sub.users[0] as any)?.phone : (sub.users as any)?.phone;
        const guestPhone = sub.phone;
        let rawPhone = guestPhone || userPhone;

        if (rawPhone && rawPhone.trim().length >= 10) {
          let phone = rawPhone.replace(/\D/g, '');
          if (phone.length === 10) {
            phone = '91' + phone;
          } else if (phone.startsWith('0') && phone.length === 11) {
            phone = '91' + phone.substring(1);
          }
          
          targets.push({
            subscriptionId: sub.id,
            userId: sub.user_id,
            phone: phone
          });
        }
      }

      return targets;
    } catch (err: any) {
      logger.error(`[StockNotificationService] Exception in getEligibleCustomersForRestock for product ${productId}:`, err);
      return [];
    }
  }
  
  /**
   * Process restock notifications for a product and dispatch them via WhatsApp
   */
  async processRestockNotifications(productId: string, productName: string, productUrl: string, stockEventReference?: string) {
    const customers: StockNotificationTarget[] = await this.getEligibleCustomersForRestock(productId);
    
    if (customers.length === 0) {
      logger.info(`[StockNotificationService] No eligible customers for restock of product ${productId}`);
      return;
    }
    
    logger.info(`[StockNotificationService] Found ${customers.length} eligible customers for restock of product ${productId}`);
    
    for (const customer of customers) {
      if (!customer.userId && !customer.isTestTarget) continue; // Currently we rely on user_id for tracking logs as per v14 schema
      
      // PHASE 6: Prevent duplicates and create pending log
      let logId: string | undefined;
      try {
        const { data: log, error: logError } = await supabase.from('stock_notification_logs').insert({
          user_id: customer.userId || null,
          product_id: productId,
          stock_event_reference: stockEventReference || null,
          status: 'pending'
        }).select('id').single();

        if (logError) {
          if (logError.code === '23505') { // Postgres Unique Violation
            logger.info(`[StockNotificationService] Duplicate prevention active. User ${customer.userId} already processed for event ${stockEventReference}`);
            continue;
          }
          throw logError;
        }
        logId = log.id;
      } catch (err) {
        logger.error(`[StockNotificationService] Failed to create pending log for user ${customer.userId}:`, err);
        continue; // Skip if we can't reliably track
      }

      logger.info(`[StockNotificationService] Attempting to send WhatsApp notification. Product: ${productId}, Subscription: ${customer.subscriptionId}, User: ${customer.userId}, PhoneFound: true`);

      // Extract the slug from the productUrl (e.g., https://amohamobiles.com/product/my-slug)
      const slug = productUrl.split('/').pop() || '';

      // Send the approved WhatsApp template for restock notifications (Utility template)
      const response = await whatsappService.sendTemplateMessage({
        to: customer.phone,
        templateName: 'restock_alert', 
        languageCode: 'en_US',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: productName }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              { type: 'text', text: slug }
            ]
          }
        ]
      });
      
      // PHASE 6: Update log with results
      const notificationStatus = response.success ? 'sent' : 'failed';
      
      if (response.success) {
        logger.info(`[StockNotificationService] WhatsApp notification sent successfully for Product: ${productId}, Subscription: ${customer.subscriptionId}, User: ${customer.userId}. Message ID: ${response.messageId}`);
      } else {
        logger.error(`[StockNotificationService] WhatsApp notification failed for Product: ${productId}, Subscription: ${customer.subscriptionId}, User: ${customer.userId}. Error:`, response.error);
      }
      
      await supabase.from('stock_notification_logs').update({
        status: notificationStatus,
        message_id: response.messageId || null,
        error_message: response.success ? null : (response.error || 'Unknown error'),
        sent_at: response.success ? new Date().toISOString() : null
      }).eq('id', logId);

      // Update subscription timestamp and status based on the delivery result
      if (customer.subscriptionId) {
        const updateData: any = { updated_at: new Date().toISOString() };
        
        if (response.success && !customer.isTestTarget) {
          updateData.notified_at = new Date().toISOString();
          updateData.notification_status = 'sent';
        } else if (!response.success && !customer.isTestTarget) {
          // If the schema supports it, we could set notification_status to 'failed' here
          // But based on requirement we just don't mark it as sent, leaving it pending or setting to failed
          updateData.notification_status = 'failed';
        }

        await supabase
          .from('stock_notification_subscriptions')
          .update(updateData)
          .eq('id', customer.subscriptionId);
          
        logger.info(`[StockNotificationService] Subscription ${customer.subscriptionId} status updated to ${updateData.notification_status}`);
      }
    }
  }

  // ==================== PHASE 8: Webhook Methods ====================

  /**
   * Process a status update from WhatsApp Webhook
   * Ensures idempotency and doesn't overwrite newer states with older ones.
   */
  async updateLogFromWebhook(
    messageId: string, 
    status: 'sent' | 'delivered' | 'read' | 'failed', 
    timestamp: string, 
    errorInfo?: { code?: string; title?: string; message?: string }
  ) {
    try {
      // Find the existing log
      const { data: log, error: fetchError } = await supabase
        .from('stock_notification_logs')
        .select('id, delivery_status, delivered_at, read_at')
        .eq('message_id', messageId)
        .single();

      if (fetchError || !log) {
        logger.debug(`[StockNotificationService] Log not found for message_id: ${messageId}`);
        return;
      }

      // Determine idempotency / state progression
      // The natural progression is sent -> delivered -> read.
      // If we already have a 'read' status, we shouldn't downgrade to 'delivered' or 'sent'.
      // If we already have a 'delivered' status, we shouldn't downgrade to 'sent'.
      const currentStatus = log.delivery_status;
      
      if (currentStatus === 'read') {
        // If it's already read, we don't care about delayed sent/delivered webhooks
        // But if it failed later (rare), we might still want to log it? Usually failure happens before read.
        if (status !== 'failed') return;
      } else if (currentStatus === 'delivered') {
        if (status === 'sent') return;
      }

      const updateData: any = {
        delivery_status: status
      };

      const dateObj = new Date(parseInt(timestamp) * 1000).toISOString();

      if (status === 'delivered' && !log.delivered_at) {
        updateData.delivered_at = dateObj;
      } else if (status === 'read' && !log.read_at) {
        updateData.read_at = dateObj;
      } else if (status === 'failed') {
        updateData.failed_at = dateObj;
        updateData.error_code = errorInfo?.code || null;
        updateData.error_title = errorInfo?.title || null;
        updateData.error_message = errorInfo?.message || null;
        // Optionally update the main status to 'failed' if it wasn't already.
        // We avoid touching main 'status' if we don't have to, but since 'failed' is a core state:
        updateData.status = 'failed';
      }

      const { error: updateError } = await supabase
        .from('stock_notification_logs')
        .update(updateData)
        .eq('id', log.id);

      if (updateError) {
        logger.error(`[StockNotificationService] Error updating webhook status for log ${log.id}:`, updateError);
      }
    } catch (err) {
      logger.error(`[StockNotificationService] Exception processing webhook for message ${messageId}:`, err);
    }
  }

  // ==================== PHASE 7: API Methods ====================

  async subscribeUser(userId: string, productId: string, whatsappOptIn: boolean) {
    if (!whatsappOptIn) {
      throw new BadRequestError('WhatsApp opt-in is required to subscribe to stock notifications.');
    }

    // Phase 7 Validation: Verify the user has a valid phone number before subscribing
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();
      
    if (userError || !user?.phone || user.phone.trim().length < 10) {
      throw new BadRequestError('Please add a valid mobile number in your profile to subscribe to WhatsApp notifications.');
    }

    // Normalize phone number (adding 91 for India if exactly 10 digits)
    let normalizedPhone = user.phone.replace(/\D/g, '');
    if (normalizedPhone.length === 10) {
      normalizedPhone = '91' + normalizedPhone;
    } else if (normalizedPhone.startsWith('0') && normalizedPhone.length === 11) {
      normalizedPhone = '91' + normalizedPhone.substring(1);
    }

    // Check for existing subscription (including cancelled ones)
    const { data: existingSub } = await supabase
      .from('stock_notification_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    let result;
    if (existingSub) {
      result = await supabase
        .from('stock_notification_subscriptions')
        .update({
          phone: normalizedPhone,
          whatsapp_opt_in: whatsappOptIn,
          status: 'active',
          notification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('stock_notification_subscriptions')
        .insert({
          user_id: userId,
          product_id: productId,
          phone: normalizedPhone,
          whatsapp_opt_in: whatsappOptIn,
          status: 'active',
          notification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      throw new BadRequestError(`Failed to subscribe: ${result.error.message}`);
    }

    return result.data;
  }

  async unsubscribeUser(userId: string, productId: string) {
    const { error } = await supabase
      .from('stock_notification_subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      throw new BadRequestError(`Failed to unsubscribe: ${error.message}`);
    }
    return { success: true };
  }

  async checkSubscription(userId: string, productId: string) {
    const { data, error } = await supabase
      .from('stock_notification_subscriptions')
      .select('status, notification_status, whatsapp_opt_in')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      throw new BadRequestError(`Failed to check subscription: ${error.message}`);
    }

    if (!data) return { subscribed: false };
    return {
      subscribed: data.status === 'active',
      status: data.status,
      notificationStatus: data.notification_status,
      whatsappOptIn: data.whatsapp_opt_in
    };
  }
}

export const stockNotificationService = new StockNotificationService();
export default stockNotificationService;
