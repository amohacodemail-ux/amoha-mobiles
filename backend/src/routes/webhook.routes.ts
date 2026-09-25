import { Router } from 'express';
import { verifyWhatsAppWebhook, processWhatsAppWebhook, processRazorpayWebhook } from '../controllers/webhook.controller';

const router = Router();

// /api/webhooks/whatsapp
router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', processWhatsAppWebhook);

// /api/webhooks/razorpay
router.post('/razorpay', processRazorpayWebhook);

export default router;
