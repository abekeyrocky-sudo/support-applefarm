import { handleIncomingMessage } from './handlers/messageHandler.js';
import { handleCallbackQuery } from './handlers/callbackHandler.js';
import { handleBusinessMessage, handleBusinessConnection } from './handlers/businessHandler.js';

/**
 * Main update dispatcher for Telegram Bot API
 * Works for both Webhook updates (Vercel) and Polling updates (Local/VPS)
 */
export async function processTelegramUpdate(update) {
  if (!update) return;

  try {
    // 1. Telegram Business Messages
    if (update.business_message) {
      await handleBusinessMessage(update.business_message);
      return;
    }

    // 2. Telegram Business Connection State Updates
    if (update.business_connection) {
      await handleBusinessConnection(update.business_connection);
      return;
    }

    // 3. Regular Messages (Private chat or Group chat)
    if (update.message) {
      await handleIncomingMessage(update.message);
      return;
    }

    // 4. Inline Keyboard Callback Queries
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }
  } catch (error) {
    console.error('💥 [Dispatcher Error in processTelegramUpdate]:', error);
  }
}
