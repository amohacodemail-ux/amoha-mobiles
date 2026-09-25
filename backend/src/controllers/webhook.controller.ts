import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger.util';
import env from '../config/env';
import stockNotificationService from '../services/stock-notification.service';
import supabase from '../config/supabase';

/**
 * Verify WhatsApp Webhook Challenge
 * GET /api/webhooks/whatsapp
 */
export const verifyWhatsAppWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('[WhatsAppWebhook] Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  logger.warn('[WhatsAppWebhook] Webhook verification failed');
  return res.sendStatus(403);
};

/**
 * Process WhatsApp Webhook Events
 * POST /api/webhooks/whatsapp
 */
export const processWhatsAppWebhook = (req: Request, res: Response) => {
  // 1. Validate signature if META_APP_SECRET is present
  if (env.META_APP_SECRET) {
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) {
      logger.warn('[WhatsAppWebhook] Missing X-Hub-Signature-256 header');
      return res.sendStatus(401);
    }
    
    // The signature comes in as: sha256=<hash>
    const [, hash] = signature.split('=');
    const expectedHash = crypto
      .createHmac('sha256', env.META_APP_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== expectedHash) {
      logger.warn('[WhatsAppWebhook] Invalid X-Hub-Signature-256 header');
      return res.sendStatus(401);
    }
  }

  const body = req.body;

  // 2. We only care about WhatsApp Business Account events
  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  // 3. Acknowledge immediately to prevent Meta from retrying
  res.sendStatus(200);

  // 4. Process entries asynchronously
  try {
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.value && change.value.statuses) {
          const statuses = change.value.statuses;
          for (const statusObj of statuses) {
            const { id, status, timestamp, errors } = statusObj;

            logger.info(`[WhatsAppWebhook] Received status update: ${status} for message ${id}`);

            // Pass to service
            let errorInfo = undefined;
            if (errors && errors.length > 0) {
              const err = errors[0];
              errorInfo = {
                code: err.code?.toString(),
                title: err.title,
                message: err.message || err.error_data?.details,
              };
              logger.error(`[WhatsAppWebhook] Message failed`, errorInfo);
            }

            // Fire and forget, handled safely within the service
            stockNotificationService.updateLogFromWebhook(id, status, timestamp, errorInfo);
          }
        }
      }
    }
  } catch (err) {
    logger.error('[WhatsAppWebhook] Error processing webhook payload:', err);
  }
};

/**
 * Process Razorpay Webhook Events
 * POST /api/webhooks/razorpay
 */
export const processRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).send('Missing Razorpay signature');
    }

    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('RAZORPAY_WEBHOOK_SECRET is not defined');
      return res.status(500).send('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('[RazorpayWebhook] Invalid signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (!event || !payload) {
      return res.status(400).send('Invalid payload');
    }

    const payment = payload.payment?.entity;

    if (!payment) {
      return res.status(200).send('OK');
    }

    const paymentId = payment.id;
    const orderId = payment.order_id;
    const amount = (payment.amount || 0) / 100;
    const currency = payment.currency || 'INR';
    const method = payment.method;

    // Retrieve existing transaction to avoid duplication
    const { data: existingTx } = await supabase
      .from('payment_transactions')
      .select('id, status')
      .eq('razorpay_payment_id', paymentId)
      .maybeSingle();

    let txStatus = 'created';
    let failureReason = null;
    let refundId = null;
    let refundAmount = null;
    let refundStatus = null;
    let refundDate = null;

    if (event === 'payment.captured') {
      txStatus = 'success';
    } else if (event === 'payment.failed') {
      txStatus = 'failed';
      failureReason = payment.error_description || payment.error_reason || 'Payment failed';
    } else if (event === 'refund.processed') {
      const refund = payload.refund?.entity;
      if (refund) {
        txStatus = 'refunded';
        refundId = refund.id;
        refundAmount = (refund.amount || 0) / 100;
        refundStatus = refund.status;
        refundDate = refund.created_at ? new Date(refund.created_at * 1000).toISOString() : null;
      }
    } else {
      // Ignore other events
      return res.status(200).send('OK');
    }

    // Upsert transaction
    const txData: any = {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount,
      currency,
      payment_method: method,
      status: txStatus,
    };

    if (failureReason) txData.failure_reason = failureReason;
    if (refundId) {
      txData.refund_id = refundId;
      txData.refund_amount = refundAmount;
      txData.refund_status = refundStatus;
      txData.refund_date = refundDate;
    }

    // Try to get customer info from email/contact if available
    if (!existingTx?.id) {
      txData.customer_email = payment.email || null;
      txData.customer_phone = payment.contact || null;
      
      // If we can link to an existing user by email
      if (payment.email) {
        const { data: user } = await supabase.from('users').select('id, name').eq('email', payment.email).maybeSingle();
        if (user) {
          txData.customer_id = user.id;
          txData.customer_name = user.name;
        }
      }
    }

    if (existingTx) {
      // Avoid reverting success to something else unless it's a refund
      if (existingTx.status === 'success' && txStatus !== 'refunded') {
        return res.status(200).send('OK');
      }
      await supabase.from('payment_transactions').update(txData).eq('id', existingTx.id);
    } else {
      await supabase.from('payment_transactions').insert([txData]);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('[RazorpayWebhook] Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};
