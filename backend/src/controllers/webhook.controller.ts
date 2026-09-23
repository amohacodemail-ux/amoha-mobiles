import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger.util';
import env from '../config/env';
import stockNotificationService from '../services/stock-notification.service';

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
