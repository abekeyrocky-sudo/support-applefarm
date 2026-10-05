import { storage } from '../storage.js';

/**
 * Generate a short, readable Ticket ID: TICK-XXXXXX
 */
export function generateTicketId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TICK-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a new support ticket in standalone storage
 */
export async function createTicket({ userId, username, firstName, category, message, farmerId = null, photoFileId = null }) {
  const ticketId = generateTicketId();
  const ticketData = {
    id: ticketId,
    userId: String(userId),
    farmerId: farmerId ? String(farmerId).replace('#', '').trim() : null,
    username: username || '',
    firstName: firstName || 'User',
    category: category || 'General Inquiry',
    message: message || '',
    photoFileId: photoFileId,
    status: 'open', // open | in_review | resolved | closed
    adminReply: null,
    adminMessageId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  storage.set(ticketId, ticketData);
  console.log(`🎟 [Ticket Saved Locally] ID: ${ticketId} for User: ${userId}`);
  return ticketData;
}

/**
 * Link Telegram admin group message ID to the ticket ID
 */
export async function linkAdminMessage(ticketId, adminMessageId) {
  const ticket = storage.get(ticketId);
  if (ticket) {
    ticket.adminMessageId = adminMessageId;
    ticket.updatedAt = new Date().toISOString();
    storage.set(ticketId, ticket);
  }
}

/**
 * Find ticket by Telegram admin group message ID
 */
export async function getTicketByAdminMessageId(adminMessageId) {
  return storage.findByAdminMessageId(adminMessageId);
}

/**
 * Get ticket by its ID
 */
export async function getTicketById(ticketId) {
  return storage.get(ticketId);
}

/**
 * Get the latest active ticket for a user
 */
export async function getLatestUserTicket(userId) {
  return storage.findLatestByUserId(userId);
}

/**
 * Update ticket with admin reply and set status
 */
export async function resolveTicket(ticketId, adminReplyText = null, status = 'resolved') {
  const ticket = storage.get(ticketId);
  if (!ticket) return null;

  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  if (adminReplyText) {
    ticket.adminReply = adminReplyText;
  }

  storage.set(ticketId, ticket);
  console.log(`✅ [Ticket ${ticketId}] updated to: ${status}`);
  return ticket;
}
