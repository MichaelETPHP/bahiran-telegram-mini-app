/**
 * Bahiran Mini App – Node.js API server
 * Single file: Telegram Web App login validation + optional static serve
 */
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Load .env from project root (parent of api/)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = Number(process.env.PORT) || 3000;
const API_BASE_URL = (process.env.API_BASE_URL || '').replace(/\/$/, ''); // no trailing slash
const AUTH_MAX_AGE_SEC = 24 * 60 * 60; // 24 hours
const DATA_DIR = path.join(__dirname, 'data');
const LOGINS_FILE = path.join(DATA_DIR, 'logins.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.css': 'text/css', '.woff2': 'font/woff2',
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function collectLogin(user, authDate) {
  if (!user) return;
  ensureDataDir();
  const record = {
    telegram_id: user.id,
    phone: user.phone_number || null,
    photo_url: user.photo_url || null,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || null,
    auth_date: authDate,
    logged_at: new Date().toISOString(),
  };
  let logins = [];
  if (fs.existsSync(LOGINS_FILE)) {
    try {
      logins = JSON.parse(fs.readFileSync(LOGINS_FILE, 'utf8'));
    } catch (_) {}
  }
  logins.push(record);
  try {
    fs.writeFileSync(LOGINS_FILE, JSON.stringify(logins, null, 2));
  } catch (e) {
    console.warn('[Login with Telegram] Could not save logins.json:', e.message);
  }
}

/**
 * Validate Telegram Web App initData (query string from Telegram.WebApp.initData)
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramInitData(initData) {
  if (!BOT_TOKEN || !initData || typeof initData !== 'string') return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  const authDate = params.get('auth_date');
  if (authDate) {
    const age = Math.floor(Date.now() / 1000) - parseInt(authDate, 10);
    if (age > AUTH_MAX_AGE_SEC || age < 0) return null;
  }
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (calculatedHash !== hash) return null;
  const userStr = params.get('user');
  if (!userStr) return { user: null, auth_date: authDate };
  try {
    const user = JSON.parse(userStr);
    return { user, auth_date: authDate };
  } catch (_) {
    return null;
  }
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (_) { resolve({}); }
    });
  });
}

function send(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

function corsHeaders(res, req) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function serveStatic(res, pathname) {
  const file = (pathname === '/' || pathname === '') ? '/index.html' : pathname;
  const filePath = path.join(FRONTEND_DIR, file.replace(/\.\./g, ''));
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  const isIndexHtml = file === '/index.html' || path.basename(filePath) === 'index.html';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(500);
      res.end('Server error');
      return;
    }
    let body = data;
    if (isIndexHtml && ext === '.html') {
      body = Buffer.from(
        data.toString('utf8').replace(/__API_BASE_URL__/g, API_BASE_URL),
        'utf8'
      );
    }
    res.setHeader('Content-Type', contentType);
    res.writeHead(200);
    res.end(body);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';
  console.log(`[Connect] ${req.method} ${pathname}`);

  corsHeaders(res, req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /api/auth/telegram – validate initData and return user
  if (pathname === '/api/auth/telegram' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const initData = body.initData || body.init_data || '';
    const result = validateTelegramInitData(initData);
    if (!result) {
      console.log('[Login with Telegram] FAIL – invalid or expired init data');
      send(res, 401, { ok: false, error: 'Invalid or expired init data' });
      return;
    }
    const u = result.user;
    const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : '—';
    console.log(`[Login with Telegram] OK – telegram_id=${u?.id ?? '—'} phone=${u?.phone_number ?? '—'} photo=${u?.photo_url ? 'yes' : 'no'} name=${name}`);
    collectLogin(result.user, result.auth_date);
    send(res, 200, {
      ok: true,
      user: result.user,
      telegram_id: u?.id ?? null,
      phone: u?.phone_number ?? null,
      photo_url: u?.photo_url ?? null,
      auth_date: result.auth_date,
    });
    return;
  }

  // GET /api/health
  if (pathname === '/api/health') {
    send(res, 200, { ok: true, service: 'bahiran-api', bot: !!BOT_TOKEN });
    return;
  }

  // Serve frontend (index.html, image/, etc.) for GET requests
  if (req.method === 'GET' && !pathname.startsWith('/api/')) {
    serveStatic(res, pathname);
    return;
  }

  send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log('[Start] Bahiran server (API + frontend)');
  console.log(`[Start] Listening on http://localhost:${PORT}`);
  console.log(`[Start] Frontend: http://localhost:${PORT}/  (serves ../frontend/)`);
  console.log(`[Start] BOT_TOKEN: ${BOT_TOKEN ? 'set' : 'NOT SET (Telegram login will fail)'}`);
  console.log(`[Start] API_BASE_URL: ${API_BASE_URL || '(same origin)'}`);
  console.log('[Start] API: GET /api/health , POST /api/auth/telegram');
});

/*
  ═══ HOW TO TEST ═══

  1) Start the server:
     cd api && npm start

  2) Health check (no auth):
     curl http://localhost:3000/api/health

  3) Login with Telegram (needs real initData from Telegram):
     - Open your Mini App from Telegram (e.g. via bot menu).
     - In the browser console run:
         copy(Telegram.WebApp.initData)
     - Then:
         curl -X POST http://localhost:3000/api/auth/telegram \
           -H "Content-Type: application/json" \
           -d '{"initData":"<paste the copied string here>"}'
     - Valid response: 200 with { ok: true, user: {...} }
     - Invalid/expired: 401 with { ok: false, error: "..." }

  4) From the Mini App: open from Telegram and tap "Continue with Telegram".
     See Doc/TESTING.md for full setup.
*/
