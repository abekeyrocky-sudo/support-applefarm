import { config } from './config.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.botToken}`;

/**
 * Low-level API call to Telegram Bot API
 */
export async function callTelegram(method, payload = {}) {
  if (!config.botToken) {
    console.error('❌ [Telegram] Bot token is missing in environment variables!');
    return { ok: false, description: 'Missing bot token' };
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      console.error(`⚠️ [Telegram API Error] ${method}:`, data.description);
    }
    return data;
  } catch (error) {
    console.error(`💥 [Telegram Fetch Error] ${method}:`, error.message);
    return { ok: false, description: error.message };
  }
}

/**
 * Send a text message (supports Markdown and HTML)
 */
export async function sendMessage(chatId, text, options = {}) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: options.parse_mode !== undefined ? options.parse_mode : 'HTML',
    disable_web_page_preview: options.disable_web_page_preview !== undefined ? options.disable_web_page_preview : true,
    ...options
  };

  // If business_connection_id is provided, pass it for Telegram Business Chat
  if (options.business_connection_id) {
    payload.business_connection_id = options.business_connection_id;
  }

  return callTelegram('sendMessage', payload);
}

/**
 * Send a photo with caption
 */
export async function sendPhoto(chatId, photo, caption = '', options = {}) {
  const payload = {
    chat_id: chatId,
    photo: photo,
    caption: caption,
    parse_mode: options.parse_mode !== undefined ? options.parse_mode : 'HTML',
    ...options
  };

  if (options.business_connection_id) {
    payload.business_connection_id = options.business_connection_id;
  }

  return callTelegram('sendPhoto', payload);
}

/**
 * Edit existing message text
 */
export async function editMessageText(chatId, messageId, text, options = {}) {
  return callTelegram('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: options.parse_mode !== undefined ? options.parse_mode : 'HTML',
    ...options
  });
}

/**
 * Edit existing photo message caption
 */
export async function editMessageCaption(chatId, messageId, caption, options = {}) {
  return callTelegram('editMessageCaption', {
    chat_id: chatId,
    message_id: messageId,
    caption: caption,
    parse_mode: options.parse_mode !== undefined ? options.parse_mode : 'HTML',
    ...options
  });
}

/**
 * Smart helper: seamlessly edits either text message or photo caption
 */
export async function updateMessage(chatId, msg, text, options = {}) {
  const messageId = typeof msg === 'object' ? msg?.message_id : msg;
  const hasPhoto = Boolean(typeof msg === 'object' && msg?.photo && msg.photo.length > 0);

  if (hasPhoto) {
    const captionRes = await editMessageCaption(chatId, messageId, text, options);
    if (captionRes && captionRes.ok) return captionRes;
  }

  const textRes = await editMessageText(chatId, messageId, text, options);
  if (textRes && textRes.ok) return textRes;

  // Fallback: send fresh message if editing is not allowed
  return sendMessage(chatId, text, options);
}

/**
 * Answer inline button callback query
 */
export async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  return callTelegram('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text,
    show_alert: showAlert
  });
}

/**
 * Long-polling helper to fetch updates
 */
export async function getUpdates(offset = 0, limit = 100, timeout = 30) {
  return callTelegram('getUpdates', {
    offset,
    limit,
    timeout,
    allowed_updates: ['message', 'callback_query', 'business_connection', 'business_message', 'edited_business_message']
  });
}

/**
 * Register Webhook for Vercel deployment
 */
export async function setWebhook(url, secretToken) {
  const payload = {
    url,
    allowed_updates: ['message', 'callback_query', 'business_connection', 'business_message', 'edited_business_message']
  };
  if (secretToken) {
    payload.secret_token = secretToken;
  }
  return callTelegram('setWebhook', payload);
}

/**
 * Delete Webhook (for switching back to local Polling mode)
 */
export async function deleteWebhook(dropPendingUpdates = false) {
  return callTelegram('deleteWebhook', { drop_pending_updates: dropPendingUpdates });
}
