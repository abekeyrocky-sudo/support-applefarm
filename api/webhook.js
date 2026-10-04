import { processTelegramUpdate } from '../src/bot.js';
import { config } from '../src/config.js';

export default async function handler(req, res) {
  // Health check endpoint on GET
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Apple Farm Support Bot API',
      hasToken: Boolean(config.botToken && config.botToken.length > 10),
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Optional: Verify secret token for Telegram Webhook security
  const telegramSecret = req.headers['x-telegram-bot-api-secret-token'];
  if (config.webhookSecret && telegramSecret && telegramSecret !== config.webhookSecret) {
    console.warn('⛔ [Webhook] Unauthorized request with invalid secret token');
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let update = req.body;
    if (typeof update === 'string') {
      try {
        update = JSON.parse(update);
      } catch (e) {
        // ignore
      }
    }

    // Process update
    if (update) {
      await processTelegramUpdate(update);
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('💥 [Webhook Error]:', error);
    // Always return 200 to Telegram to prevent retry flooding
    return res.status(200).json({ ok: true, error: error.message });
  }
}
