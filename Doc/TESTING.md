# How to test with Ngrok

One server runs on port **3000** (API + frontend). Expose it with Ngrok so Telegram can open the Mini App.

---

## 1. Start the server

```bash
cd api
npm start
```

You should see:

```
[Start] Bahiran server (API + frontend)
[Start] Listening on http://localhost:3000
[Start] Frontend: http://localhost:3000/  (serves ../frontend/)
[Start] BOT_TOKEN: set
[Start] API_BASE_URL: https://... (or "(same origin)" if not set)
[Start] API: GET /api/health , POST /api/auth/telegram
```

Open in browser: **http://localhost:3000**

---

## 2. Ngrok tunnel

Expose port 3000 so Telegram can load your Mini App:

```bash
ngrok http 3000
```

Copy the **https** URL (e.g. `https://abc123.ngrok-free.app`).

- In [BotFather](https://t.me/botfather): **Bot Settings → Configure Mini App → Set URL** and paste this URL.
- When users open the bot’s Mini App, Telegram loads that URL. The same server serves the app and the API, so set **API_BASE_URL** in `.env` to this Ngrok URL (server injects it into the app); for same-origin leave it empty.

---

## 3. Quick checklist

1. **API:** `curl http://localhost:3000/api/health` → `{"ok":true,...}`
2. **App:** Open http://localhost:3000 → Mini App loads.
3. **With Ngrok:** Run `ngrok http 3000`, set that https URL in BotFather, open the bot in Telegram and launch the Mini App.
