/**
 * Bahiran Delivery – Telegram Bot  (production-grade)
 *
 * Flow:
 *   /start  →  keyboard with [Share Phone] + [Open App]
 *   user shares phone  →  bot generates JWT  →  sends "Open App" inline button
 *                         with ?token=<jwt>  →  mini app auto-logins, no extra tap
 *
 * Security:
 *   - JWT signed with JWT_SECRET, 48-hour expiry
 *   - initData HMAC validation available via /api/auth/verify
 *   - Phone normalized (+251...)
 *   - Rate-limit: max 5 /start per user per minute
 *   - Contact must belong to the sender (anti-spoofing)
 *
 * Run:  node bot/bot.js   or   npm run start:bot
 */

const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

// ─── Load .env from project root ───────────────────────────────────────────
const projectEnv = path.join(__dirname, '..', '.env');
try {
  if (fs.existsSync(projectEnv)) {
    fs.readFileSync(projectEnv, 'utf8').split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) {          // don't overwrite real env vars
        process.env[m[1].trim()] = m[2].trim().replace(/\r$/, '');
      }
    });
    log('✓', 'Loaded .env from ' + projectEnv);
  }
} catch (_) { /* ignore */ }

// ─── Colours ────────────────────────────────────────────────────────────────
const C = { red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', reset:'\x1b[0m' };
function log(level, msg) {
  const colour = level==='✓' ? C.green : level==='⚠' ? C.yellow : C.red;
  console.log(colour + '[bot] ' + level + ' ' + msg + C.reset);
}
function die(msg) { log('✗', msg); process.exit(1); }

// ─── Validate required env ──────────────────────────────────────────────────
const BOT_TOKEN   = (process.env.BOT_TOKEN   || '').trim();
const JWT_SECRET  = (process.env.JWT_SECRET  || '').trim();
const MINI_APP_URL = (process.env.MINI_APP_URL || process.env.API_BASE_URL || '').trim();

if (!BOT_TOKEN)   die('BOT_TOKEN not set in .env');
if (!JWT_SECRET)  die('JWT_SECRET not set in .env  (generate: openssl rand -hex 32)');
if (!MINI_APP_URL) log('⚠', 'MINI_APP_URL not set — Open App button will be skipped');

log('✓', 'BOT_TOKEN set');
log('✓', 'JWT_SECRET set (' + JWT_SECRET.length + ' chars)');
if (MINI_APP_URL) log('✓', 'MINI_APP_URL = ' + MINI_APP_URL);

// ─── Load node-telegram-bot-api ─────────────────────────────────────────────
let TelegramBot;
try   { TelegramBot = require('node-telegram-bot-api'); }
catch { die('Run: npm install node-telegram-bot-api'); }
log('✓', 'node-telegram-bot-api loaded');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ─── In-memory user store (replace with DB for production) ──────────────────
// Map<telegramId, { phone, firstName, lastName, username, registeredAt, lastSeen }>
const users = new Map();

// ─── Rate limiter (per userId, max 5 per 60 s) ──────────────────────────────
const rateLimiter = new Map();   // Map<userId, { count, windowStart }>
const RATE_LIMIT  = 5;
const RATE_WINDOW = 60_000;      // 1 minute

function isRateLimited(userId) {
  const now  = Date.now();
  const rec  = rateLimiter.get(userId) || { count: 0, windowStart: now };
  if (now - rec.windowStart > RATE_WINDOW) {
    rateLimiter.set(userId, { count: 1, windowStart: now });
    return false;
  }
  rec.count++;
  rateLimiter.set(userId, rec);
  return rec.count > RATE_LIMIT;
}

// ─── JWT helpers (no external library needed — pure crypto) ─────────────────
function b64url(buf) {
  return (Buffer.isBuffer(buf) ? buf : Buffer.from(JSON.stringify(buf)))
    .toString('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

function makeJWT(payload) {
  const header  = b64url({ alg:'HS256', typ:'JWT' });
  const body    = b64url({ ...payload, iat: Math.floor(Date.now()/1000) });
  const sig     = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(header + '.' + body)
    .digest('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return header + '.' + body + '.' + sig;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const sig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(parts[0] + '.' + parts[1])
      .digest('base64')
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    if (sig !== parts[2]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  } catch { return null; }
}

// ─── Phone normaliser ────────────────────────────────────────────────────────
function normalizePhone(raw) {
  let p = String(raw).replace(/[\s\-().]/g, '');
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

// ─── Build mini app URL with JWT token ──────────────────────────────────────
function buildAppUrl(token) {
  if (!MINI_APP_URL) return '';
  const sep = MINI_APP_URL.includes('?') ? '&' : '?';
  return MINI_APP_URL + sep + 'token=' + encodeURIComponent(token);
}

// ─── Upsert user ─────────────────────────────────────────────────────────────
function upsertUser(from, phone) {
  const existing = users.get(from.id) || {};
  const user = {
    telegramId : from.id,
    phone      : phone || existing.phone || null,
    firstName  : from.first_name || existing.firstName || '',
    lastName   : from.last_name  || existing.lastName  || '',
    username   : from.username   || existing.username  || '',
    registeredAt: existing.registeredAt || new Date().toISOString(),
    lastSeen   : new Date().toISOString(),
  };
  users.set(from.id, user);
  return user;
}

// ─── Main message handler ────────────────────────────────────────────────────
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const from   = msg.from || {};
  const text   = (msg.text || '').trim();

  // ── Rate limit check ──────────────────────────────────────────────────────
  if (isRateLimited(from.id)) {
    return bot.sendMessage(chatId,
      '⏳ Too many requests. Please wait a moment.',
      { reply_markup: { remove_keyboard: true } }
    ).catch(console.error);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CASE 1: User shared their contact (phone number)
  // ══════════════════════════════════════════════════════════════════════════
  if (msg.contact) {
    // Security: ensure the contact belongs to the sender, not someone else's
    if (msg.contact.user_id && msg.contact.user_id !== from.id) {
      return bot.sendMessage(chatId,
        '❌ Please share your own phone number, not someone else\'s.'
      ).catch(console.error);
    }

    const phone = normalizePhone(msg.contact.phone_number);
    const user  = upsertUser(from, phone);

    log('✓', 'Phone received: ' + phone + ' from @' + (from.username || from.id));

    // Generate JWT — 48-hour expiry
    const token = makeJWT({
      sub        : String(from.id),
      telegram_id: from.id,
      phone,
      name       : user.firstName + (user.lastName ? ' ' + user.lastName : ''),
      username   : user.username,
      exp        : Math.floor(Date.now()/1000) + (48 * 60 * 60),   // 48 hours
    });

    const appUrl = buildAppUrl(token);

    // Remove the reply keyboard, send inline button to open app
    const replyOpts = {
      parse_mode  : 'Markdown',
      reply_markup: { remove_keyboard: true },
    };

    if (appUrl) {
      replyOpts.reply_markup = {
        remove_keyboard: true,
        inline_keyboard: [[{
          text   : '🍽️ Open Bahiran Delivery',
          web_app: { url: appUrl },
        }]],
      };
    }

    return bot.sendMessage(chatId,
      '✅ *Phone verified!*\n\n' +
      'Welcome, *' + escMd(user.firstName) + '*!\n' +
      'Tap the button below to start ordering.',
      replyOpts
    ).catch(console.error);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CASE 2: /start or /start <payload>
  // ══════════════════════════════════════════════════════════════════════════
  if (text.startsWith('/start')) {
    upsertUser(from, null);   // register user even without phone
    const payload = text.slice(6).trim();   // everything after "/start "

    // /start with a deep-link token (e.g. from a referral or re-open link)
    if (payload && payload !== 'share_phone') {
      const decoded = verifyJWT(payload);
      if (decoded) {
        const appUrl = buildAppUrl(payload);
        return bot.sendMessage(chatId,
          '👋 Welcome back, *' + escMd(from.first_name) + '*!',
          {
            parse_mode  : 'Markdown',
            reply_markup: appUrl ? {
              inline_keyboard: [[{ text:'🍽️ Open Bahiran Delivery', web_app:{ url:appUrl } }]],
            } : undefined,
          }
        ).catch(console.error);
      }
    }

    // Standard /start — show welcome with phone-share + open-app buttons
    const keyboard = [];

    // Row 1: Open App (if URL configured) — uses initData for identity
    if (MINI_APP_URL) {
      keyboard.push([{ text: '🍽️ Open Bahiran Delivery', web_app: { url: MINI_APP_URL } }]);
    }

    // Row 2: Share phone for full auto-login
    keyboard.push([{ text: '📱 Share Phone Number', request_contact: true }]);

    return bot.sendMessage(chatId,
      '👋 *Welcome to Bahiran Delivery!*\n\n' +
      '🍛 Authentic Ethiopian food delivered to your door.\n\n' +
      'Tap *Share Phone Number* for instant login, or open the app directly.',
      {
        parse_mode  : 'Markdown',
        reply_markup: {
          keyboard          : keyboard,
          one_time_keyboard : true,
          resize_keyboard   : true,
        },
      }
    ).catch(console.error);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CASE 3: /help
  // ══════════════════════════════════════════════════════════════════════════
  if (text === '/help') {
    return bot.sendMessage(chatId,
      '📖 *Bahiran Delivery Help*\n\n' +
      '/start — Open the app\n' +
      '/help  — Show this message\n\n' +
      'For support, contact @BahiranSupport',
      { parse_mode: 'Markdown' }
    ).catch(console.error);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CASE 4: Anything else → nudge toward /start
  // ══════════════════════════════════════════════════════════════════════════
  return bot.sendMessage(chatId,
    'Send /start to open Bahiran Delivery 🍛',
    { reply_markup: { remove_keyboard: true } }
  ).catch(console.error);
});

// ─── Inline query support (optional — lets users share the app) ──────────────
bot.on('inline_query', (query) => {
  if (!MINI_APP_URL) return;
  bot.answerInlineQuery(query.id, [
    {
      type               : 'article',
      id                 : '1',
      title              : '🍛 Bahiran Delivery',
      description        : 'Open Ethiopian food delivery app',
      input_message_content: {
        message_text: '🍛 *Bahiran Delivery* — Ethiopian food at your door!\n\nOpen the app: ' + MINI_APP_URL,
        parse_mode  : 'Markdown',
      },
    }
  ], { cache_time: 0 }).catch(console.error);
});

// ─── Polling error handler ───────────────────────────────────────────────────
bot.on('polling_error', (err) => {
  // 409 = another instance running — exit so PM2/systemd can restart cleanly
  if (err.code === 'ETELEGRAM' && String(err.message).includes('409')) {
    die('409 Conflict — another bot instance is running. Stop the other instance first.');
  }
  log('⚠', 'Polling error: ' + err.message);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown() {
  log('⚠', 'Shutting down…');
  bot.stopPolling();
  process.exit(0);
}
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

// ─── Markdown escape helper ───────────────────────────────────────────────────
function escMd(str) {
  return String(str || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// ─── Export verifyJWT so your API (api.js/app.js) can reuse it ───────────────
// Usage in api.js:  const { verifyJWT } = require('./bot');
module.exports = { verifyJWT, makeJWT, normalizePhone };

// ─── Startup: verify token with Telegram ─────────────────────────────────────
bot.getMe()
  .then((me) => {
    log('✓', 'Connected as @' + (me.username || me.id));
    log('✓', 'Bot is running. Send /start to @' + me.username);
    if (!MINI_APP_URL) log('⚠', 'Set MINI_APP_URL in .env to enable Open App button');
  })
  .catch((err) => die('Bot connection failed: ' + err.message));