import { sendMessage, sendPhoto } from '../telegram.js';
import { en, escapeHtml } from '../locales/en.js';
import { config, isAdmin } from '../config.js';
import { userSessions } from './callbackHandler.js';
import { createTicket, linkAdminMessage } from '../services/ticketService.js';
import { handleAdminReply, handleAdminCommands } from './adminHandler.js';

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
    // Check if it's an admin slash command like /resolve
    if (text.startsWith('/')) {
      const handled = await handleAdminCommands(message);
      if (handled) return;
    }
  }

  // 2. Commands for regular private chats
  if (text === '/start' || text === '/menu') {
    userSessions.delete(userId);
    return sendMessage(
      chatId,
      `${en.welcome.title}\n\n${en.welcome.subtitle}\n\n${en.welcome.chooseOption}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: en.buttons.openTicket, callback_data: 'action:open_ticket' },
              { text: en.buttons.checkStatus, callback_data: 'action:check_status' }
            ],
            [
              { text: en.buttons.faq, callback_data: 'action:faq' },
              { text: en.buttons.playGame, url: config.miniAppUrl }
            ],
            [
              { text: en.buttons.community, url: config.channelUrl }
            ]
          ]
        }
      }
    );
  }

  if (text === '/help') {
    return sendMessage(
      chatId,
      `ℹ️ <b>Apple Farm Help Center</b>\n\nUse the buttons below to open a ticket or check our frequently asked questions:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.openTicket, callback_data: 'action:open_ticket' }],
            [{ text: en.buttons.faq, callback_data: 'action:faq' }]
          ]
        }
      }
    );
  }

  // 3. User is actively submitting ticket details
  const session = userSessions.get(userId);
  if (session && session.step === 'WAITING_FOR_TICKET_DETAILS') {
    let photoFileId = null;
    if (message.photo && message.photo.length > 0) {
      photoFileId = message.photo[message.photo.length - 1].file_id;
    }

    if (!text && !photoFileId) {
      return sendMessage(chatId, "⚠️ Please provide a text description or a screenshot of your issue.");
    }

    // Create ticket in standalone storage
    const ticket = await createTicket({
      userId: userId,
      username: message.from.username,
      firstName: message.from.first_name,
      category: session.category,
      message: text || '[Screenshot attached]',
      photoFileId: photoFileId
    });

    // Clear session state
    userSessions.delete(userId);

    // 1) Send confirmation to User
    await sendMessage(chatId, en.ticketPrompt.created(ticket.id), {
      reply_markup: {
        inline_keyboard: [
          [{ text: en.buttons.checkStatus, callback_data: 'action:check_status' }],
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
              { text: '✅ Mark Resolved', callback_data: `admin:resolve:${ticket.id}` }
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
      `Hello! To open a support ticket or ask a question, please use the button below:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.openTicket, callback_data: 'action:open_ticket' }],
            [{ text: en.buttons.backToMenu, callback_data: 'action:main_menu' }]
          ]
        }
      }
    );
  }
}
