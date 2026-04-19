# How to test with Ngrok

One server runs on port **3000** (serves frontend only; all data comes from **https://api.bahirandelivery.cloud/**). Expose with Ngrok so Telegram can open the Mini App.

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
[Start] Frontend: http://localhost:3000/
[Start] BAHIRAN_API_BASE_URL: https://api.bahirandelivery.cloud
```

Open in browser: **http://localhost:3000** — the app will call the external API for login, restaurants, orders.

---

## 2. Ngrok tunnel

Expose port 3000 so Telegram can load your Mini App:

```bash
ngrok http 3000
```

Copy the **https** URL (e.g. `https://abc123.ngrok-free.app`).

- In **.env** set `API_BASE_URL=https://abc123.ngrok-free.app` (your Ngrok URL), then restart the server.
- In [BotFather](https://t.me/botfather): **Bot Settings → Configure Mini App → Set URL** and paste this URL.

The frontend is served from Ngrok; all backend calls (login, restaurants, orders) go to **https://api.bahirandelivery.cloud/**.

---

## 3. Quick checklist

1. **Local:** Open http://localhost:3000 → Mini App loads and uses https://api.bahirandelivery.cloud for API.
2. **Ngrok:** Run `ngrok http 3000`, set `API_BASE_URL` in .env, restart server, set Mini App URL in BotFather.
3. **Telegram:** Open the bot and launch the Mini App.

See **RUN-WITH-NGROK.md** for full step-by-step.
