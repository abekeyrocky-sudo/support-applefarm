import { sendMessage, sendPhoto } from '../telegram.js';
import { en, escapeHtml } from '../locales/en.js';
import { config, isAdmin } from '../config.js';
import { userSessions } from './callbackHandler.js';
import { createTicket, linkAdminMessage } from '../services/ticketService.js';
import { handleAdminReply, handleAdminCommands } from './adminHandler.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_START_IMG = path.join(__dirname, '../../assets/support-bot-start-img.jpg');
const TELEGRAM_START_IMAGE_ID = 'AgACAgUAAxkDAANNasNRlWyeLsKJqiNUhIckRynEHnAAAqsSaxtwTxhWVucaHRtTI8IBAAMCAANzAAM9BA';
const FALLBACK_BANNER_URL = 'https://raw.githubusercontent.com/abekeyrocky-sudo/support-applefarm/main/assets/support-bot-start-img.jpg';

function getStartImage() {
  if (fs.existsSync(LOCAL_START_IMG)) {
    return LOCAL_START_IMG;
  }
  return TELEGRAM_START_IMAGE_ID || FALLBACK_BANNER_URL;
}

export async function handleIncomingMessage(message) {
  if (!message) return;

  const chatId = message.chat.id;
  const userId = message.from?.id;
  const text = message.text?.trim() || message.caption?.trim() || '';
  const isPrivate = message.chat.type === 'private';

  // 1. If message is sent in the Admin Chat / Support Group:
  if (String(chatId) === String(config.adminChatId) || isAdmin(userId)) {
    // Check if it's an admin reply to a forwarded ticket message
    if (message.reply_to_message) {
      const handled = await handleAdminReply(message);
      if (handled) return;
    }
    // Check if it's an admin slash command like /resolve or /tickets
    if (text.startsWith('/')) {
      const handled = await handleAdminCommands(message);
      if (handled) return;
    }
  }

  // 2. Commands for regular private chats
  if (text === '/start' || text === '/menu') {
    userSessions.delete(userId);

    const caption = `${en.welcome.title}\n\n${en.welcome.subtitle}\n\n${en.welcome.chooseOption}`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: en.buttons.openTicket, callback_data: 'action:open_ticket', style: 'success' }
        ],
        [
          { text: en.buttons.checkStatus, callback_data: 'action:check_status', style: 'primary' },
          { text: en.buttons.faq, callback_data: 'action:faq', style: 'primary' }
        ],
        [
          { text: en.buttons.playGame, url: config.miniAppUrl, style: 'success' },
          { text: en.buttons.community, url: config.channelUrl, style: 'primary' }
        ]
      ]
    };

    // Try sending rich photo banner first
    const photoRes = await sendPhoto(chatId, getStartImage(), caption, { reply_markup: keyboard });
    if (!photoRes || !photoRes.ok) {
      return sendMessage(chatId, caption, { reply_markup: keyboard });
    }
    return photoRes;
  }

  if (text === '/help') {
    return sendMessage(
      chatId,
      `<b>Apple Farm Help Center</b>\n\nUse the buttons below to open a ticket or check our frequently asked questions:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.openTicket, callback_data: 'action:open_ticket', style: 'success' }],
            [{ text: en.buttons.faq, callback_data: 'action:faq', style: 'primary' }]
          ]
        }
      }
    );
  }

  // 3. User is in ticket creation flow
  const session = userSessions.get(userId);

  // Step 3a: Waiting for Farmer ID
  if (session && session.step === 'WAITING_FOR_FARMER_ID') {
    const rawNumber = text.replace(/[^0-9]/g, '');

    if (!rawNumber || rawNumber.length < 3) {
      return sendMessage(chatId, en.ticketPrompt.invalidFarmerId, {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.cancel, callback_data: 'action:main_menu', style: 'danger' }]
          ]
        }
      });
    }

    // Farmer ID is valid, proceed to issue description step
    session.farmerId = rawNumber;
    session.step = 'WAITING_FOR_TICKET_DETAILS';

    return sendMessage(chatId, en.ticketPrompt.askDetails(rawNumber), {
      reply_markup: {
        inline_keyboard: [
          [{ text: en.buttons.cancel, callback_data: 'action:main_menu', style: 'danger' }]
        ]
      }
    });
  }

  // Step 3b: Waiting for Ticket Details & Screenshot
  if (session && session.step === 'WAITING_FOR_TICKET_DETAILS') {
    let photoFileId = null;
    if (message.photo && message.photo.length > 0) {
      photoFileId = message.photo[message.photo.length - 1].file_id;
    }

    if (!text && !photoFileId) {
      return sendMessage(chatId, "Please provide a text description or a screenshot of your issue.");
    }

    // Create ticket in standalone storage
    const ticket = await createTicket({
      userId: userId,
      farmerId: session.farmerId,
      username: message.from.username,
      firstName: message.from.first_name,
      category: session.category,
      message: text || '[Screenshot attached]',
      photoFileId: photoFileId
    });

    // Clear session state
    userSessions.delete(userId);

    // 1) Send confirmation to User
    await sendMessage(chatId, en.ticketPrompt.created(ticket.id, session.farmerId), {
      reply_markup: {
        inline_keyboard: [
          [{ text: en.buttons.checkStatus, callback_data: 'action:check_status', style: 'primary' }],
          [{ text: en.buttons.backToMenu, callback_data: 'action:main_menu' }]
        ]
      }
    });

    // 2) Forward notification to Admin Group / Admin Chat
    if (config.adminChatId) {
      const adminButtons = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Mark as Resolved', callback_data: `admin:resolve:${ticket.id}`, style: 'success' }
            ]
          ]
        }
      };

      const notificationText = en.admin.ticketNotification(ticket);

      let adminMsg;
      if (photoFileId) {
        adminMsg = await sendPhoto(config.adminChatId, photoFileId, notificationText, adminButtons);
      } else {
        adminMsg = await sendMessage(config.adminChatId, notificationText, adminButtons);
      }

      // Link admin group message ID with the ticket for Telegram 2-way replies!
      if (adminMsg?.ok && adminMsg.result?.message_id) {
        await linkAdminMessage(ticket.id, adminMsg.result.message_id);
      }
    }
    return;
  }

  // 4. Default fallback in private chat if user sends arbitrary message without session
  if (isPrivate && !text.startsWith('/')) {
    return sendMessage(
      chatId,
      `Hello! To open a support ticket or ask a question, please tap below:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.openTicket, callback_data: 'action:open_ticket', style: 'success' }],
            [{ text: en.buttons.backToMenu, callback_data: 'action:main_menu' }]
          ]
        }
      }
    );
  }
}
