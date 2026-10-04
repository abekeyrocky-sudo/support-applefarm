import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Vercel serverless environment, use /tmp which is writable
const isServerless = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? '/tmp/apple_support_data' : path.join(__dirname, '..', 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

// Safely ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ [Storage] Could not create storage directory, using in-memory only:', err.message);
}

// In-memory cache for fast access
let ticketsMap = new Map();

// Load existing tickets from disk on startup
function loadTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const raw = fs.readFileSync(TICKETS_FILE, 'utf8');
      const list = JSON.parse(raw);
      ticketsMap = new Map(list.map(t => [t.id, t]));
      console.log(`📦 [Storage] Loaded ${ticketsMap.size} tickets.`);
    } else {
      try {
        fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), 'utf8');
      } catch (e) {
        // Ignore if read-only
      }
    }
  } catch (err) {
    console.warn('⚠️ [Storage Load Warning]:', err.message);
  }
}

// Save all tickets to disk safely
function saveTickets() {
  try {
    const list = Array.from(ticketsMap.values());
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    // If running in a read-only environment, keep in memory without throwing
    console.warn('⚠️ [Storage Save Warning]: keeping in memory only');
  }
}

loadTickets();

export const storage = {
  get(id) {
    return ticketsMap.get(id) || null;
  },

  getAll() {
    return Array.from(ticketsMap.values());
  },

  set(id, data) {
    ticketsMap.set(id, data);
    saveTickets();
  },

  findByAdminMessageId(adminMessageId) {
    for (const ticket of ticketsMap.values()) {
      if (ticket.adminMessageId === adminMessageId) {
        return ticket;
      }
    }
    return null;
  },

  findLatestByUserId(userId) {
    const userTickets = Array.from(ticketsMap.values())
      .filter(t => String(t.userId) === String(userId));
    return userTickets.length > 0 ? userTickets[userTickets.length - 1] : null;
  }
};
