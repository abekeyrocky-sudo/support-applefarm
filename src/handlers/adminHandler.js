import { sendMessage } from '../telegram.js';
import { getTicketByAdminMessageId, resolveTicket, getTicketById } from '../services/ticketService.js';
import { storage } from '../storage.js';
import { escapeHtml } from '../locales/en.js';

/**
 * Handle two-way reply when an Admin hits "Reply" on a ticket message in the Admin group
 */
export async function handleAdminReply(message) {
  const replyToMsgId = message.reply_to_message?.message_id;
  if (!replyToMsgId) return false;

  const replyText = message.text || message.caption;
  if (!replyText) return false;

  const ticket = await getTicketByAdminMessageId(replyToMsgId);
  if (!ticket) {
    // Not linked to an active support ticket, ignore
    return false;
  }

  // 1. Send the admin's reply to the User's personal Telegram chat
  const userMessage = 
    `💬 <b>Response from Apple Farm Support (Ticket #${ticket.id})</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${escapeHtml(replyText)}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>If your issue is resolved, no further action is needed. If you still have questions, you can continue typing here.</i>`;

  const sendResult = await sendMessage(ticket.userId, userMessage);

  if (sendResult?.ok) {
    // Update ticket in local storage
    await resolveTicket(ticket.id, replyText, 'in_review');

    // Confirm to Admin in the group
    await sendMessage(
      message.chat.id,
      `✅ <b>Delivered to user @${escapeHtml(ticket.username || ticket.userId)}</b> (Ticket <code>${ticket.id}</code>)`,
      { reply_to_message_id: message.message_id }
    );
  } else {
    await sendMessage(
      message.chat.id,
      `❌ Failed to deliver message to user <code>${ticket.userId}</code>. The user may have blocked the bot.`,
      { reply_to_message_id: message.message_id }
    );
  }
  return true;
}

/**
 * Admin slash commands executed in admin chat
 */
export async function handleAdminCommands(message) {
  const text = message.text?.trim() || '';
  const chatId = message.chat.id;

  // 1. /tickets - list recent open tickets
  if (text.startsWith('/tickets')) {
    const all = storage.getAll().filter(t => t.status === 'open');
    if (all.length === 0) {
      await sendMessage(chatId, "ℹ️ No open tickets at the moment. All caught up! 🎉");
      return true;
    }

    let report = `📋 <b>Open Tickets (${all.length}):</b>\n\n`;
    all.slice(0, 10).forEach((t, i) => {
      report += `${i + 1}. <code>${t.id}</code> - @${escapeHtml(t.username || t.userId)}: "${escapeHtml(t.message.slice(0, 30))}"\n`;
    });
    await sendMessage(chatId, report);
    return true;
  }

  // 2. /resolve <ticket_id>
  if (text.startsWith('/resolve')) {
    const parts = text.split(' ');
    const ticketId = parts[1]?.trim()?.toUpperCase();

    if (!ticketId) {
      await sendMessage(chatId, "⚠️ Usage: <code>/resolve &lt;ticket_id&gt;</code>");
      return true;
    }

    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      await sendMessage(chatId, `❌ Ticket <code>${ticketId}</code> not found.`);
      return true;
    }

    await resolveTicket(ticketId, 'Resolved by Support Team', 'resolved');
    await sendMessage(chatId, `✅ Ticket <code>${ticketId}</code> marked as resolved.`);

    await sendMessage(
      ticket.userId,
      `✅ <b>Your support ticket #${ticketId} has been marked as resolved.</b>\nThank you for reaching out to Apple Farm Support!`
    );
    return true;
  }

  return false;
}
