import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  adminChatId: process.env.ADMIN_CHAT_ID || process.env.ADMIN_IDS || '8067887716',
  adminIds: (process.env.ADMIN_IDS || '8067887716').split(',').map(s => s.trim()).filter(Boolean),
  miniAppUrl: process.env.MINI_APP_URL || 'https://apple-farm-plum.vercel.app',
  channelUrl: process.env.CHANNEL_URL || 'https://t.me/AppleFarmCommunity',
  mainBotUrl: process.env.MAIN_BOT_URL || 'https://t.me/Apple_farm_bot',
  webhookUrl: process.env.WEBHOOK_URL || '',
  webhookSecret: process.env.WEBHOOK_SECRET || 'apple_farm_support_secret'
};

export function isAdmin(userId) {
  if (!userId) return false;
  return config.adminIds.includes(String(userId));
}
