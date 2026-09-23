import request from 'supertest';
import app from '../app';
import env from '../config/env';
import crypto from 'crypto';
import stockNotificationService from '../services/stock-notification.service';

jest.mock('../services/stock-notification.service');

describe('WhatsApp Webhook', () => {
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN || 'test-verify-token';
  const appSecret = env.META_APP_SECRET || 'test-app-secret';
  
  beforeAll(() => {
    // Mock environment for tests
    (env as any).WHATSAPP_VERIFY_TOKEN = verifyToken;
    (env as any).META_APP_SECRET = appSecret;
  });

  describe('GET Verification', () => {
    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'challenge-code'
        });
      
      expect(res.status).toBe(403);
    });

    it('should return 200 and challenge if token is valid', async () => {
      const res = await request(app)
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': 'challenge-code'
        });
      
      expect(res.status).toBe(200);
      expect(res.text).toBe('challenge-code');
    });
  });

  describe('POST Processing', () => {
    const generateSignature = (payload: any) => {
      return 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
    };

    it('should return 401 if signature is missing', async () => {
      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .send({ object: 'whatsapp_business_account' });
      
      expect(res.status).toBe(401);
    });

    it('should return 401 if signature is invalid', async () => {
      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('x-hub-signature-256', 'sha256=invalid-signature')
        .send({ object: 'whatsapp_business_account' });
      
      expect(res.status).toBe(401);
    });

    it('should return 200 and process payload if valid', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid.HBgLOTkxMjM0NTY3ODkAFQADSDFKJSDFLKJ',
                      status: 'delivered',
                      timestamp: '1690000000'
                    }
                  ]
                }
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('x-hub-signature-256', generateSignature(payload))
        .send(payload);
      
      expect(res.status).toBe(200);
      expect(stockNotificationService.updateLogFromWebhook).toHaveBeenCalledWith(
        'wamid.HBgLOTkxMjM0NTY3ODkAFQADSDFKJSDFLKJ',
        'delivered',
        '1690000000',
        undefined
      );
    });

    it('should process failed status with error info', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid.123',
                      status: 'failed',
                      timestamp: '1690000000',
                      errors: [
                        {
                          code: 131056,
                          title: 'Message Undeliverable',
                          message: 'User blocked the number'
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('x-hub-signature-256', generateSignature(payload))
        .send(payload);
      
      expect(res.status).toBe(200);
      expect(stockNotificationService.updateLogFromWebhook).toHaveBeenCalledWith(
        'wamid.123',
        'failed',
        '1690000000',
        {
          code: '131056',
          title: 'Message Undeliverable',
          message: 'User blocked the number'
        }
      );
    });
  });
});
