import { config } from './src/config.js';
import { getUpdates, deleteWebhook } from './src/telegram.js';
import { processTelegramUpdate } from './src/bot.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🍏 Starting Apple Farm Support Bot (Polling Mode)...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!config.botToken || config.botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  console.error('\n❌ [ERROR] TELEGRAM_BOT_TOKEN is not configured in .env file!');
  console.log('👉 Please create a bot with @BotFather, then paste your token in .env');
  console.log('👉 See .env.example for guidance.\n');
  process.exit(1);
}

let isRunning = true;
let updateOffset = 0;

async function startPolling() {
  console.log('🔄 Cleaning old webhooks for polling mode...');
  await deleteWebhook(false);
  console.log('🚀 Support Bot is now polling for updates and ready to serve!');

  while (isRunning) {
    try {
      const response = await getUpdates(updateOffset, 100, 25);
      if (response && response.ok && Array.isArray(response.result)) {
        for (const update of response.result) {
          updateOffset = update.update_id + 1;
          // Process each update
          await processTelegramUpdate(update);
        }
      } else if (!response.ok) {
        console.warn('⚠️ Polling warning:', response.description);
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error('💥 Polling error:', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping bot gracefully...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping bot gracefully...');
  isRunning = false;
  process.exit(0);
});

startPolling();
