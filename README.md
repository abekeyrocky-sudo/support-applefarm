# 🍏 Apple Farm Support Center Bot (Worldwide & Telegram Business Ready)

A modern, 24/7 automated Customer Support, Ticketing, and Telegram Business Bot tailored specifically for **Apple Farm Telegram Mini App (TMA)**.

---

## 🌟 Key Features

1. **Dual Architecture (Polling + Serverless Webhook)**:
   - Run locally or on VPS with long polling (`npm start`).
   - Or deploy to **Vercel Serverless** with 0 hosting costs (`/api/webhook`).
2. **Telegram Business Integration (Chat Automation)**:
   - Supports Telegram Business `business_message` updates.
   - Automatically replies to users contacting your personal Telegram account on behalf of Apple Farm Support.
   - **Smart Pause**: Pauses automated replies when the owner is actively typing.
3. **Dedicated Ticket System**:
   - Categories: *Withdrawal / TON Payout*, *Referral Bonus*, *Wheel Spin / Tasks*, *General*.
   - Generates unique ticket tracking codes (`#TICK-XXXXXX`).
   - Supports screenshot / photo uploads.
4. **Two-Way Support Group Relay**:
   - Forwards tickets into your designated Admin Support Group.
   - Admins can simply **Reply** to the forwarded message in Telegram, and the bot delivers the reply directly to the player's inbox!
5. **Firestore Live Data Lookup**:
   - Directly checks player balance, level, and recent withdrawals from the Apple Farm database.
   - Admin command: `/lookup <telegram_id>`.
6. **Worldwide Professional English**:
   - Clean, polite, and international English text with built-in FAQ answers.

---

## 📁 Project Structure

```text
Apple Support bot/
├── api/
│   └── webhook.js             # Vercel Serverless entry point
├── scripts/
│   └── setWebhook.js          # Helper script to link Vercel URL with Telegram
├── src/
│   ├── config.js              # Environment settings & admin lists
│   ├── firebase.js            # Firestore database connection
│   ├── telegram.js            # Telegram Bot API client
│   ├── bot.js                 # Central update dispatcher
│   ├── locales/
│   │   └── en.js              # English copy, buttons & FAQ dictionary
│   ├── services/
│   │   ├── ticketService.js   # Firestore support_tickets management
│   │   └── playerService.js   # Player data and withdrawal lookup
│   └── handlers/
│       ├── messageHandler.js  # Direct user chat & ticket intake
│       ├── callbackHandler.js # Inline button clicks & navigation
│       ├── adminHandler.js    # Two-way group replies & admin commands
│       └── businessHandler.js # Telegram Business auto-reply engine
├── .env.example               # Config template
├── .gitignore                 # Strict rules preventing secret leaks
├── index.js                   # Local / VPS Polling entry point
├── vercel.json                # Vercel routing configuration
└── package.json               # Dependencies
```

---

## 🚀 Quick Setup & Local Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
- `TELEGRAM_BOT_TOKEN`: The bot token from [@BotFather](https://t.me/BotFather).
- `ADMIN_CHAT_ID`: Your Telegram User ID or your Admin Support Group Chat ID (e.g. `-100xxxxxxxxxx`).
- `ADMIN_IDS`: Comma-separated admin IDs (e.g. `8067887716`).

### 3. Run Locally (Polling Mode)
```bash
npm start
```
Open Telegram, search for your bot, and send `/start`!

---

## 🌐 Deploying to Vercel (100% Free Hosting)

### Step 1: Push to GitHub
Create a new GitHub repository (make sure `.env` is ignored):
```bash
git init
git add .
git commit -m "feat: Apple Farm Support Bot initial release"
git remote add origin https://github.com/YOUR_USERNAME/apple-farm-support-bot.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. In **Environment Variables**, add the keys from your `.env` file (`TELEGRAM_BOT_TOKEN`, `ADMIN_CHAT_ID`, `ADMIN_IDS`, `FIREBASE_PROJECT_ID`, etc.).
4. Click **Deploy**.

### Step 3: Register Telegram Webhook
Once Vercel gives you your URL (e.g., `https://apple-farm-support.vercel.app`):
Run the helper script on your machine:
```bash
node scripts/setWebhook.js https://apple-farm-support.vercel.app/api/webhook
```
✅ Your bot is now running 24/7 on Vercel Serverless!

---

## 💼 Setting up Telegram Business (Chat Automation)

To connect this bot to your personal Telegram account (as seen in Telegram Business settings):
1. In Telegram, open **Settings** > **Telegram Business** > **Chat Automation** (or **Chatbots**).
2. Enter your support bot's username (e.g., `@AppleFarmSupportBot`).
3. Allow permissions: **Reply to messages**.
4. Configure **Chats the bot can access**:
   - Choose *All private chats except...* and add friends/family to *Excluded chats*.
5. Tap **Done**!
Now, whenever a user messages your Telegram account about Apple Farm, the bot will automatically greet them, offer assistance, and notify your support group!

---

## 🛡️ Admin Commands Reference

In your Admin Support Group:
- **Direct Reply**: Simply swipe or click **Reply** to any forwarded ticket message. The bot will deliver your message directly to the player's Telegram inbox.
- `/lookup <user_id>`: Check a player's Apple Farm balance, diamonds, energy, referrals, and recent withdrawal requests.
- `/resolve <ticket_id>`: Close and mark a ticket as resolved.
