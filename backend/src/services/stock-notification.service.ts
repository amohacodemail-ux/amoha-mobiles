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
        const phone = userPhone || guestPhone;

        if (phone && phone.trim().length >= 10) {
          targets.push({
            subscriptionId: sub.id,
            userId: sub.user_id,
            phone: phone.trim()
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
          }
        ]
      });
      
      // PHASE 6: Update log with results
      const notificationStatus = response.success ? 'sent' : 'failed';
      
      if (response.success) {
        logger.info(`stack update sent to whatsapp for ${customer.phone}`);
      } else {
        logger.error(`stack update not sent to whatsapp for ${customer.phone}:`, response.error);
      }
      
      await supabase.from('stock_notification_logs').update({
        status: notificationStatus,
        message_id: response.messageId || null,
        error_message: response.success ? null : (response.error || 'Unknown error'),
        sent_at: response.success ? new Date().toISOString() : null
      }).eq('id', logId);

      // Update subscription timestamp based on the delivery result
      // We keep the status as 'active' so they can be notified again if stock drops to 0 and restocks later.
      if (response.success && !customer.isTestTarget && customer.subscriptionId) {
        await supabase
          .from('stock_notification_subscriptions')
          .update({
            notified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.subscriptionId);
      }
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

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('stock_notification_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('status', 'active')
      .maybeSingle();

    let result;
    if (existingSub) {
      result = await supabase
        .from('stock_notification_subscriptions')
        .update({
          whatsapp_opt_in: whatsappOptIn,
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
