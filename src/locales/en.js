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
    subtitle: "We are here 24/7 to help you with withdrawals, referral questions, and gameplay issues.",
    chooseOption: "<b>Select an option below to get instant help:</b>"
  },

  buttons: {
    openTicket: "Open Support Ticket",
    checkStatus: "Check Ticket Status",
    faq: "FAQs & Rules",
    playGame: "Play Apple Farm",
    community: "Official Channel",
    backToMenu: "Main Menu",
    backToFaq: "Back to FAQs",
    cancel: "Cancel",
    confirmSubmit: "Submit Ticket"
  },

  categories: {
    title: "<b>Select Your Issue Category:</b>",
    prompt: "Choose the topic that best matches your problem:",
    withdraw: "Withdrawal / TON Payout",
    referral: "Referral Bonus / Friends",
    spinTask: "Wheel Spin & Tasks Bug",
    other: "General & Account Issue"
  },

  ticketPrompt: {
    description: "<b>Please describe your issue in detail:</b>\n\nInclude any relevant details (e.g. your TON wallet address, transaction amount, or error message). You can also attach a screenshot directly with your message.",
    created: (ticketId) => `<b>Your Ticket has been submitted successfully!</b>\n\nTicket ID: <code>${ticketId}</code>\nStatus: <b>IN REVIEW</b>\n\nOur support team has received your ticket and will reply directly to your Telegram inbox. Thank you for your patience!`,
    cancelled: "Ticket creation was cancelled. Feel free to reach out anytime."
  },

  status: {
    noTickets: "You currently do not have any open support tickets.",
    ticketDetails: (ticket) => 
      `<b>Ticket Details:</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Ticket ID: <code>${ticket.id}</code>\n` +
      `Category: ${escapeHtml(ticket.category)}\n` +
      `Submitted: ${new Date(ticket.createdAt).toUTCString()}\n` +
      `Status: <b>${ticket.status.toUpperCase()}</b>\n` +
      `Issue: ${escapeHtml(ticket.message)}\n` +
      (ticket.adminReply ? `\nAdmin Response:\n<i>${escapeHtml(ticket.adminReply)}</i>` : `\n<i>Our support team is currently investigating your ticket.</i>`)
  },

  businessAutoReply: {
    greeting: (userName) => 
      `Hello ${escapeHtml(userName || 'there')}!\n\n` +
      `Thank you for contacting <b>Apple Farm Official Support</b>.\n\n` +
      `How can we assist you today? Please reply with your issue details or wallet address, or tap the button below to open a support ticket directly with our team.`
  },

  faq: {
    title: "<b>Frequently Asked Questions (FAQ)</b>",
    items: [
      {
        q: "How long do withdrawals take?",
        a: "Withdrawals are processed in automated batches. TON network transfers usually arrive within 1 to 24 hours. Please make sure your wallet address is a valid non-custodial TON wallet (e.g. Tonkeeper)."
      },
      {
        q: "Why didn't my referral count increase?",
        a: "A referral is counted when your invited friend starts the bot and harvests their first apple. If they already had an account before clicking your link, it will not count as a new invite."
      },
      {
        q: "Wheel Spin / Daily Energy Reset",
        a: "Daily free spins and harvest energy refresh every 24 hours at 00:00 UTC. Special tasks must be completed and manually claimed."
      },
      {
        q: "Is Apple Farm safe and verified?",
        a: "Yes! Apple Farm operates transparently on the TON blockchain ecosystem with real on-chain payouts and community events."
      }
    ]
  },

  admin: {
    ticketNotification: (ticket) =>
      `<b>NEW SUPPORT TICKET</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Ticket ID: <code>${ticket.id}</code>\n` +
      `User: ${escapeHtml(ticket.firstName)} (@${escapeHtml(ticket.username || 'N/A')})\n` +
      `User ID: <code>${ticket.userId}</code>\n` +
      `Category: <b>${escapeHtml(ticket.category)}</b>\n` +
      `Message:\n${escapeHtml(ticket.message)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>Reply directly to this message to send an answer to the user.</i>`
  }
};
