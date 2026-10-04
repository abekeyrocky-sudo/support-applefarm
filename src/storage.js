import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
      console.log(`📦 [Standalone Storage] Loaded ${ticketsMap.size} tickets from local storage.`);
    } else {
      fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (err) {
    console.error('⚠️ [Storage Load Error]:', err.message);
  }
}

// Save all tickets to disk
function saveTickets() {
  try {
    const list = Array.from(ticketsMap.values());
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ [Storage Save Error]:', err.message);
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
