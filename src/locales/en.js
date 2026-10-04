export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const en = {
  welcome: {
    title: "🍎 <b>Welcome to Apple Farm Support Center!</b>",
    subtitle: "We are here to help you 24/7 with any questions, withdrawal inquiries, or feedback regarding Apple Farm.",
    chooseOption: "Please choose an option below to get instant help or speak with an agent:"
  },

  buttons: {
    openTicket: "🎟 Open Support Ticket",
    checkStatus: "🔍 Check Ticket Status",
    faq: "❓ FAQs & Rules",
    playGame: "🎮 Play Apple Farm",
    community: "📢 Official Channel",
    backToMenu: "🔙 Main Menu",
    cancel: "❌ Cancel",
    confirmSubmit: "✅ Submit Ticket"
  },

  categories: {
    title: "📂 <b>Select Your Issue Category:</b>",
    prompt: "Choose the topic that best describes your issue:",
    withdraw: "💳 Withdrawal / TON Payout",
    referral: "👥 Referral Bonus / Friends",
    spinTask: "🎡 Wheel Spin / Task Bug",
    other: "💬 General / Account Issue"
  },

  ticketPrompt: {
    description: "✍️ <b>Please describe your issue in detail:</b>\n\nInclude any relevant details (e.g., your TON wallet address, transaction amount, or error message). You can also attach a <b>screenshot</b> directly with your message.",
    created: (ticketId) => `🎉 <b>Your Ticket has been submitted successfully!</b>\n\n🔖 <b>Ticket ID:</b> <code>${ticketId}</code>\n⏳ <b>Status:</b> In Review\n\nOur support team has received your ticket and will reply directly to your Telegram inbox. Thank you for your patience!`,
    cancelled: "❌ Ticket creation was cancelled. Feel free to reach out anytime!"
  },

  status: {
    noTickets: "ℹ️ You currently do not have any open support tickets.",
    ticketDetails: (ticket) => 
      `📋 <b>Ticket Details:</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 <b>Ticket ID:</b> <code>${ticket.id}</code>\n` +
      `📂 <b>Category:</b> ${escapeHtml(ticket.category)}\n` +
      `⏱ <b>Submitted:</b> ${new Date(ticket.createdAt).toUTCString()}\n` +
      `📌 <b>Status:</b> <b>${ticket.status.toUpperCase()}</b>\n` +
      `📝 <b>Issue:</b> ${escapeHtml(ticket.message)}\n` +
      (ticket.adminReply ? `\n💬 <b>Admin Response:</b>\n<i>${escapeHtml(ticket.adminReply)}</i>` : `\n⏳ Our support team is currently investigating your ticket.`)
  },

  businessAutoReply: {
    greeting: (userName) => 
      `👋 <b>Hello ${escapeHtml(userName || 'there')}!</b>\n\n` +
      `Thank you for contacting <b>Apple Farm Official Support</b>.\n\n` +
      `How can we assist you today? Please reply with your issue details or wallet address so our team can assist you as quickly as possible!`
  },

  faq: {
    title: "📚 <b>Frequently Asked Questions (FAQ)</b>",
    items: [
      {
        q: "💳 How long do withdrawals take?",
        a: "Withdrawals are processed in automated batches. TON network transfers usually arrive within 1 to 24 hours. Please make sure your wallet address is a valid non-custodial TON wallet (e.g. Tonkeeper)."
      },
      {
        q: "👥 Why didn't my referral count increase?",
        a: "A referral is counted when your invited friend starts the bot and harvests their first apple. If they already had an account before clicking your link, it will not count as a new invite."
      },
      {
        q: "🎡 Wheel Spin / Daily Energy Reset",
        a: "Daily free spins and harvest energy refresh every 24 hours at 00:00 UTC. Special tasks must be completed and manually claimed."
      },
      {
        q: "🛡️ Is Apple Farm safe and legit?",
        a: "Yes! Apple Farm operates transparently on the TON blockchain ecosystem with real on-chain payouts and community events."
      }
    ]
  },

  admin: {
    ticketNotification: (ticket) =>
      `🚨 <b>NEW SUPPORT TICKET</b> 🚨\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 <b>Ticket ID:</b> <code>${ticket.id}</code>\n` +
      `👤 <b>User:</b> ${escapeHtml(ticket.firstName)} (@${escapeHtml(ticket.username || 'N/A')})\n` +
      `🆔 <b>User ID:</b> <code>${ticket.userId}</code>\n` +
      `📂 <b>Category:</b> <b>${escapeHtml(ticket.category)}</b>\n` +
      `📝 <b>Message:</b>\n${escapeHtml(ticket.message)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 <i>Reply directly to this message to send an answer to the user.</i>`
  }
};
