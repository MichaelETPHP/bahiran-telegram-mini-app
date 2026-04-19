/**
 * Bahiran Mini App – Static server only
 * Serves the frontend; all API calls go to external API (BAHIRAN_API_BASE_URL).
 * No MongoDB, no local auth – frontend uses https://api.bahirandelivery.cloud
 *
 * External API endpoints (from Bahrain_Delivery_API_Complete_Collection.json):
 * Base: BAHIRAN_API_BASE_URL (default https://api.bahirandelivery.cloud)
 *
 * Health:        GET  /
 *                GET  /health
 * Auth:          POST /api/v1/users/signup
 *                POST /api/v1/users/verifySignupOTP
 *                POST /api/v1/users/login
 *                POST /api/v1/users/verifyOTP
 *                POST /api/v1/users/auth/telegram-phone
 *                POST /api/v1/users/auth/telegram-token   ← LOGIN: body { telegramId: "5576139140" } (test user); response: token + data.user; then use token for restaurants, orders, etc.
 *                POST /api/v1/users/requestResetOTP
 *                POST /api/v1/users/resetPasswordOTP
 * Users:         POST /api/v1/users/getMe
 *                PATCH /api/v1/users/updateMyPassword
 *                PATCH /api/v1/users/updateMe
 *                POST /api/v1/users/saveLocation
 *                GET  /api/v1/users/myAddresses
 *                PATCH /api/v1/users/address/:addressId
 *                DELETE /api/v1/users/address/:addressId
 * Restaurants:   GET  /api/v1/restaurants/?page=1&limit=10
 *                GET  /api/v1/restaurants/:id
 *                GET  /api/v1/restaurants/:id/menu
 *                GET  /api/v1/restaurants/distance-from-coords?latitude=&longitude=
 * Foods/Menus:   GET  /api/v1/food-menus/
 *                GET  /api/v1/foods/?page=1&limit=10
 *                GET  /api/v1/foods/by-menu/:menuId
 * Orders:        POST /api/v1/orders/place-order
 *                POST /api/v1/orders/estimate-delivery-fee
 *                GET  /api/v1/orders/getServiceFee
 *                GET  /api/v1/orders/my-orders
 *                GET  /api/v1/orders/getOrdersByPhone
 * Deliveries:    GET  /api/v1/deliveries/
 * Balance:       GET  /api/v1/balance/
 * Reviews:       GET  /api/v1/restaurants/:restaurantId/reviews
 *                POST /api/v1/restaurants/:restaurantId/reviews
 * Config:        GET  /api/v1/config/getFirebaseConfig
 * Protected routes use header: Authorization: Bearer <token>
 */
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Load .env from project root or cwd
const envPaths = [path.join(__dirname, '..', '.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/\r$/, '');
    });
    break;
  }
}

const PORT = Number(process.env.PORT) || 3000;
const API_BASE_URL = (process.env.API_BASE_URL || '').replace(/\/$/, '');
const BAHIRAN_API_BASE_URL = (process.env.BAHIRAN_API_BASE_URL || 'https://api.bahirandelivery.cloud').replace(/\/$/, '');
const CHAPA_SECRET = (process.env.CHAPA_SECRET || '').trim();
const CHAPA_INITIALIZE_URL = 'https://api.chapa.co/v1/transaction/initialize';
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.css': 'text/css', '.woff2': 'font/woff2',
};

function send(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

function corsHeaders(res, req) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Proxy /api/v1/* to external API (avoids CORS; login and all API go through here)
function proxyToExternalApi(req, res, pathname, queryString, bodyBuffer) {
  const targetUrl = BAHIRAN_API_BASE_URL + pathname + (queryString ? '?' + queryString : '');
  const isLogin = pathname === '/api/v1/users/auth/telegram-token';

  // CMD log: request
  if (bodyBuffer && bodyBuffer.length) {
    try {
      const bodyStr = bodyBuffer.toString('utf8');
      console.log('[API] Body:', bodyStr);
      if (isLogin) {
        const j = JSON.parse(bodyStr);
        console.log('[API] Login request → telegramId:', j.telegramId || '(missing)');
      }
    } catch (_) {}
  }
  console.log('[API] Proxy →', req.method, pathname, '→', targetUrl);

  const parsed = url.parse(targetUrl);
  const isHttps = parsed.protocol === 'https:';
  const opts = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.path,
    method: req.method,
    headers: {},
  };
  const auth = req.headers.authorization;
  const contentType = req.headers['content-type'];
  if (auth) opts.headers['Authorization'] = auth;
  if (contentType) opts.headers['Content-Type'] = contentType;
  if (bodyBuffer && bodyBuffer.length) opts.headers['Content-Length'] = bodyBuffer.length;

  const lib = isHttps ? https : http;
  const proxyReq = lib.request(opts, (proxyRes) => {
    const status = proxyRes.statusCode;
    console.log('[API] Proxy response ←', status, pathname);
    if (isLogin) {
      if (status >= 200 && status < 300) console.log('[API] Login OK – token sent to client');
      else console.log('[API] Login FAIL – status', status);
    }

    const exclude = ['connection', 'transfer-encoding', 'keep-alive'];
    const headers = {};
    for (const k of Object.keys(proxyRes.headers)) {
      if (!exclude.includes(k.toLowerCase())) headers[k] = proxyRes.headers[k];
    }
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    console.error('[API] Proxy ERROR:', err.message);
    console.error('[API] Check network and', BAHIRAN_API_BASE_URL);
    res.writeHead(502);
    res.end(JSON.stringify({ ok: false, error: 'Bad gateway' }));
  });
  if (bodyBuffer && bodyBuffer.length) proxyReq.write(bodyBuffer);
  proxyReq.end();
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
      // Empty BAHIRAN_API_BASE so frontend calls same-origin; we proxy /api/v1/* to external API
      const injectApiBase = '';
      body = Buffer.from(
        data.toString('utf8')
          .replace(/__API_BASE_URL__/g, API_BASE_URL)
          .replace(/__BAHIRAN_API_BASE_URL__/g, injectApiBase),
        'utf8'
      );
    }
    res.setHeader('Content-Type', contentType);
    res.writeHead(200);
    res.end(body);
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';
  const queryString = parsed.search ? parsed.search.slice(1) : '';
  console.log('[Connect]', req.method, pathname);

  corsHeaders(res, req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/health – readiness check
  if (pathname === '/api/health') {
    send(res, 200, {
      ok: true,
      service: 'bahiran-mini-app',
      externalApi: BAHIRAN_API_BASE_URL,
    });
    return;
  }

  // POST /api/chapa/initialize – proxy to Chapa with server-held secret (no key in frontend)
  if (pathname === '/api/chapa/initialize' && req.method === 'POST') {
    const body = await readBody(req);
    if (!CHAPA_SECRET) {
      res.writeHead(500);
      res.end(JSON.stringify({ status: 'error', message: 'Chapa not configured (CHAPA_SECRET)' }));
      return;
    }
    let payload;
    try {
      payload = JSON.parse(body.toString('utf8'));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON body' }));
      return;
    }
    if (process.env.CHAPA_CALLBACK_URL) payload.callback_url = process.env.CHAPA_CALLBACK_URL;
    if (process.env.CHAPA_RETURN_URL) payload.return_url = process.env.CHAPA_RETURN_URL;
    const outBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const opts = {
      hostname: 'api.chapa.co',
      port: 443,
      path: '/v1/transaction/initialize',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CHAPA_SECRET,
        'Content-Type': 'application/json',
        'Content-Length': outBody.length,
      },
    };
    const proxyReq = https.request(opts, (proxyRes) => {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const data = Buffer.concat(chunks);
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });
    proxyReq.on('error', (err) => {
      console.error('[Chapa] Error:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ status: 'error', message: 'Chapa request failed' }));
    });
    proxyReq.write(outBody);
    proxyReq.end();
    return;
  }

  // Proxy /api/v1/* to external API (login, restaurants, orders, etc.) – avoids CORS
  if (pathname.startsWith('/api/v1/')) {
    const body = (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') ? await readBody(req) : Buffer.alloc(0);
    proxyToExternalApi(req, res, pathname, queryString, body);
    return;
  }

  // Serve frontend for all other GET
  if (req.method === 'GET' && !pathname.startsWith('/api/')) {
    if (pathname === '/' || pathname === '/index.html') console.log('[Connect] App loaded (frontend)');
    serveStatic(res, pathname);
    return;
  }

  console.log('[Connect] 404 Not found:', req.method, pathname);
  send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log('');
  console.log('========== BAHIRAN MINI APP (logs go to this CMD, not browser) ==========');
  console.log('[Start] Server: http://localhost:' + PORT + '  → serves frontend');
  console.log('[Start] External API: ' + BAHIRAN_API_BASE_URL);
  console.log('[Start] API_BASE_URL (injected): ' + (API_BASE_URL || '(same origin)'));
  console.log('[Start] When you test in Telegram Mini App, watch this window for [Connect] [API] logs.');
  console.log('');
});
