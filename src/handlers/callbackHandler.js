import { sendMessage, updateMessage, answerCallbackQuery } from '../telegram.js';
import { en, escapeHtml } from '../locales/en.js';
import { config } from '../config.js';
import { getLatestUserTicket, getTicketById, resolveTicket } from '../services/ticketService.js';

// In-memory user state map: userId -> { step: 'WAITING_FOR_TICKET_DETAILS', category: string }
export const userSessions = new Map();

/**
 * Handle all inline keyboard callback queries
 */
export async function handleCallbackQuery(callbackQuery) {
  const data = callbackQuery.data;
  const message = callbackQuery.message;
  const chatId = message?.chat?.id;
  const userId = callbackQuery.from.id;
  const queryId = callbackQuery.id;

  if (!data || !chatId) return;

  // 1. Navigation: Main Menu
  if (data === 'action:main_menu') {
    await answerCallbackQuery(queryId);
    userSessions.delete(userId);
    return updateMessage(chatId, message, `${en.welcome.title}\n\n${en.welcome.subtitle}\n\n${en.welcome.chooseOption}`, {
      reply_markup: {
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
      }
    });
  }

  // 2. Open Ticket: Select Category
  if (data === 'action:open_ticket') {
    await answerCallbackQuery(queryId);
    return updateMessage(chatId, message, `${en.categories.title}\n\n${en.categories.prompt}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: en.categories.withdraw, callback_data: 'cat:withdraw', style: 'primary' }],
          [{ text: en.categories.referral, callback_data: 'cat:referral', style: 'primary' }],
          [{ text: en.categories.spinTask, callback_data: 'cat:spintask', style: 'primary' }],
          [{ text: en.categories.other, callback_data: 'cat:other', style: 'primary' }],
          [{ text: en.buttons.backToMenu, callback_data: 'action:main_menu' }]
        ]
      }
    });
  }

  // 3. Category Chosen: Prompt for Issue Description & Screenshot
  if (data.startsWith('cat:')) {
    await answerCallbackQuery(queryId);
    const catKey = data.replace('cat:', '');
    const categoryName = {
      withdraw: 'Withdrawal / TON Payout',
      referral: 'Referral Bonus / Friends',
      spintask: 'Wheel Spin & Tasks Bug',
      other: 'General & Account Issue'
    }[catKey] || 'General Support';

    // Store state in session
    userSessions.set(userId, {
      step: 'WAITING_FOR_TICKET_DETAILS',
      category: categoryName
    });

    return updateMessage(
      chatId, 
      message, 
      `<b>Selected Category:</b> ${escapeHtml(categoryName)}\n\n${en.ticketPrompt.description}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.cancel, callback_data: 'action:main_menu', style: 'danger' }]
          ]
        }
      }
    );
  }

  // 4. Check Ticket Status
  if (data === 'action:check_status') {
    await answerCallbackQuery(queryId);
    const latest = await getLatestUserTicket(userId);
    if (!latest) {
      return updateMessage(chatId, message, en.status.noTickets, {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.openTicket, callback_data: 'action:open_ticket', style: 'success' }],
            [{ text: en.buttons.backToMenu, callback_data: 'action:main_menu' }]
          ]
        }
      });
    }

    return updateMessage(chatId, message, en.status.ticketDetails(latest), {
      reply_markup: {
        inline_keyboard: [
          [{ text: en.buttons.openTicket, callback_data: 'action:open_ticket', style: 'success' }],
          [{ text: en.buttons.backToMenu, callback_data: 'action:main_menu' }]
        ]
      }
    });
  }

  // 5. FAQ List
  if (data === 'action:faq') {
    await answerCallbackQuery(queryId);
    const buttons = en.faq.items.map((item, index) => [
      { text: item.q, callback_data: `faq:item_${index}`, style: 'primary' }
    ]);
    buttons.push([{ text: en.buttons.backToMenu, callback_data: 'action:main_menu' }]);

    return updateMessage(chatId, message, `${en.faq.title}\n\nSelect a question to view the answer:`, {
      reply_markup: { inline_keyboard: buttons }
    });
  }

  // 6. View Specific FAQ Item
  if (data.startsWith('faq:item_')) {
    await answerCallbackQuery(queryId);
    const index = parseInt(data.replace('faq:item_', ''), 10);
    const item = en.faq.items[index];
    if (item) {
      return updateMessage(chatId, message, `<b>${escapeHtml(item.q)}</b>\n\n${escapeHtml(item.a)}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: en.buttons.backToFaq, callback_data: 'action:faq', style: 'primary' }],
            [{ text: en.buttons.openTicket, callback_data: 'action:open_ticket', style: 'success' }]
          ]
        }
      });
    }
  }

  // 7. Admin Action: Resolve Ticket
  if (data.startsWith('admin:resolve:')) {
    const ticketId = data.replace('admin:resolve:', '');
    await answerCallbackQuery(queryId, 'Marking ticket as resolved...');
    const ticket = await getTicketById(ticketId);

    if (ticket) {
      await resolveTicket(ticketId, 'Resolved by Admin', 'resolved');

      // Edit admin card
      await updateMessage(chatId, message, `<b>TICKET RESOLVED</b>\nTicket ID: <code>${ticketId}</code>\nUser: <code>${ticket.userId}</code>`);

      // Notify User
      await sendMessage(
        ticket.userId,
        `<b>Good news! Your ticket #${ticketId} has been resolved by our support team.</b>\n\nIf you have any further questions, feel free to open a new ticket anytime.`
      );
    }
  }
}
