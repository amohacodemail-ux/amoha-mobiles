import env from '../config/env';
import logger from '../utils/logger.util';

export interface WhatsAppTemplatePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[]; // Allow passing dynamic components (parameters, buttons, etc.)
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: any;
}

class WhatsAppService {
  private get isConfigured(): boolean {
    return !!env.WHATSAPP_ACCESS_TOKEN && !!env.WHATSAPP_PHONE_NUMBER_ID;
  }

  private get apiUrl(): string {
    return `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  }

  /**
   * Sends a template message using the Meta WhatsApp Cloud API.
   */
  async sendTemplateMessage(payload: WhatsAppTemplatePayload): Promise<WhatsAppResponse> {
    if (!this.isConfigured) {
      logger.warn('[WhatsAppService] Meta WhatsApp Cloud API is not configured (missing token or phone ID). Skipping message to ' + payload.to);
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      // Ensure phone number has country code (defaults to 91 for India if not provided, assuming Amoha Mobiles is in India)
      let phoneNumber = payload.to.replace(/\D/g, '');
      if (phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      }

      const requestBody = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: payload.templateName,
          language: {
            code: payload.languageCode || 'en',
          },
          components: payload.components || [],
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: any = await response.json();

      if (!response.ok) {
        logger.error(`[WhatsAppService] Meta API Error for ${phoneNumber}: ${response.status} ${response.statusText}`, {
          error: data.error,
          templateName: payload.templateName
        });
        return { success: false, error: data.error || 'Unknown Meta API error' };
      }

      const messageId = data.messages?.[0]?.id;
      logger.info(`[WhatsAppService] Template message sent successfully to ${phoneNumber}. Message ID: ${messageId}`);
      return { success: true, messageId };

    } catch (err: any) {
      logger.error(`[WhatsAppService] Network or unexpected error sending to ${payload.to}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
