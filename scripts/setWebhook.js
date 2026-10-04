import dotenv from 'dotenv';
import { setWebhook, callTelegram } from '../src/telegram.js';

dotenv.config();

const webhookUrl = process.argv[2] || process.env.WEBHOOK_URL;
const secretToken = process.env.WEBHOOK_SECRET || 'apple_farm_support_secret';

if (!webhookUrl) {
  console.error('\n❌ Please provide your Vercel Webhook URL!');
  console.log('Usage: node scripts/setWebhook.js https://your-project.vercel.app/api/webhook\n');
  process.exit(1);
}

console.log(`🔗 Registering Webhook with Telegram...`);
console.log(`URL: ${webhookUrl}`);

const res = await setWebhook(webhookUrl, secretToken);

if (res.ok) {
  console.log('✅ Webhook registered successfully!');
  const info = await callTelegram('getWebhookInfo');
  console.log('📡 Webhook Status:', info.result);
} else {
  console.error('❌ Failed to register webhook:', res.description);
}
