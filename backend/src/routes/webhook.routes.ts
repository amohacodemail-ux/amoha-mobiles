import { Router } from 'express';
import { verifyWhatsAppWebhook, processWhatsAppWebhook } from '../controllers/webhook.controller';

const router = Router();

// /api/webhooks/whatsapp
router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', processWhatsAppWebhook);

export default router;
