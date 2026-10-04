import { sendMessage } from '../telegram.js';
import { en, escapeHtml } from '../locales/en.js';
import { config } from '../config.js';

// Track recent auto-replies per customer to avoid spamming on every sentence
// customerId -> timestamp
const lastAutoReply = new Map();
// Track manual replies by business owner so bot stays paused while owner is chatting
// chatId -> timestamp
const manualChatActivity = new Map();

const AUTO_REPLY_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown
const OWNER_PAUSE_DURATION_MS = 10 * 60 * 1000; // 10 minutes pause if owner typed

/**
 * Handle Telegram Business Connection update
 */
export async function handleBusinessConnection(connection) {
  console.log(`💼 [Business Connection] ID: ${connection.id}, User: ${connection.user?.id}, CanReply: ${connection.can_reply}, IsEnabled: ${connection.is_enabled}`);
}

/**
 * Handle incoming Telegram Business Messages (chat automation)
 */
export async function handleBusinessMessage(businessMessage) {
  if (!businessMessage) return;

  const connectionId = businessMessage.business_connection_id;
  const chatId = businessMessage.chat?.id;
  const senderId = businessMessage.from?.id;
  const senderName = businessMessage.from?.first_name || 'Valued Player';
  const text = businessMessage.text || businessMessage.caption || '';
  const now = Date.now();

  // 1. Detect if the message was sent by the business owner
  // In Telegram Business, if message sender is the account owner, don't auto-reply to oneself
  if (config.adminIds.includes(String(senderId))) {
    // Record that owner is manually interacting in this chat
    manualChatActivity.set(chatId, now);
    return;
  }

  // 2. Check if owner was recently chatting in this chat (Smart Pause)
  const lastOwnerActivity = manualChatActivity.get(chatId) || 0;
  if (now - lastOwnerActivity < OWNER_PAUSE_DURATION_MS) {
    // Owner is actively in conversation, do not interrupt
    return;
  }

  // 3. Check cooldown per user to avoid replying to every single sentence
  const lastReplyTime = lastAutoReply.get(senderId) || 0;
  if (now - lastReplyTime < AUTO_REPLY_COOLDOWN_MS) {
    return;
  }

  // 4. Send Auto-Reply on behalf of the account with colorful inline buttons
  lastAutoReply.set(senderId, now);

  const replyText = en.businessAutoReply.greeting(senderName);

  await sendMessage(chatId, replyText, {
    business_connection_id: connectionId,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎟️ Open Support Center Bot ➔', url: 'https://t.me/AppleFarm_Support_bot?start=support' }
        ],
        [
          { text: '🍏 Play Apple Farm Mini App', url: config.miniAppUrl }
        ],
        [
          { text: '📢 Official Community Channel', url: config.channelUrl }
        ]
      ]
    }
  });

  // 5. Notify the Support Admin that a player messaged via Telegram Business
  if (config.adminChatId) {
    const notifyAdmin = 
      `💼 <b>New Telegram Business Customer Message</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>From:</b> ${escapeHtml(senderName)} (@${escapeHtml(businessMessage.from?.username || 'N/A')})\n` +
      `🆔 <b>ID:</b> <code>${senderId}</code>\n` +
      `💬 <b>Message:</b> "${escapeHtml(text)}"\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>Automated greeting with Support Bot button was sent.</i>`;

    await sendMessage(config.adminChatId, notifyAdmin, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💬 Open Chat With User', url: `tg://user?id=${senderId}` }
          ]
        ]
      }
    });
  }
}
