# Run frontend locally with Ngrok + Bahiran API

Run the Mini App frontend locally, expose it with Ngrok for Telegram, and use **https://api.bahirandelivery.cloud/** for login, restaurants, orders, and all other backend services.

---

## 1. Environment (.env)

In the project root, ensure `.env` has:

```env
PORT=3000
API_BASE_URL=
BAHIRAN_API_BASE_URL=https://api.bahirandelivery.cloud
BOT_TOKEN=your_bot_token
```

- **API_BASE_URL** – Leave empty for local testing in the browser. When using Ngrok, set it to your Ngrok HTTPS URL (e.g. `https://abc123.ngrok-free.app`) so the server injects it into the frontend; required when opening the app from Telegram.
- **BAHIRAN_API_BASE_URL** – Backend API base. Default is `https://api.bahirandelivery.cloud`. The frontend uses this for:
  - **Login:** `POST /api/v1/users/auth/telegram-token` (Get Token by Telegram ID)
  - **Restaurants:** `GET /api/v1/restaurants/`
  - **Restaurant menu:** `GET /api/v1/restaurants/:id/menu`
  - **Orders:** `GET /api/v1/orders/my-orders`, `POST /api/v1/orders/place-order`
  - **Get Me:** `POST /api/v1/users/getMe`

---

## 2. Start the frontend server (local)

From the project root:

```bash
cd api
npm start
```

Or from root:

```bash
npm run start:api
```

Server runs at **http://localhost:3000**. Open it in a browser to use the app locally. All API calls go to **https://api.bahirandelivery.cloud/**.

---

## 3. Expose with Ngrok (for Telegram Mini App)

In a **second terminal**:

```bash
ngrok http 3000
```

Copy the **HTTPS** URL (e.g. `https://abc123.ngrok-free.app`).

1. **Update .env:** Set `API_BASE_URL=https://abc123.ngrok-free.app` (your Ngrok URL).
2. **Restart the server** (Ctrl+C in the `api` terminal, then `npm start` again) so it injects the new URL into the frontend.
3. **BotFather:** Open your bot in Telegram → Bot Settings → Configure Mini App → set the Mini App URL to the same Ngrok HTTPS URL.

When users open the Mini App from Telegram, the app loads from Ngrok and still calls **https://api.bahirandelivery.cloud/** for all backend services.

---

## 4. Quick checklist

| Step | Command / action |
|------|-------------------|
| 1. Start server | `cd api && npm start` |
| 2. Local test | Open http://localhost:3000 (API base = https://api.bahirandelivery.cloud) |
| 3. Ngrok | In another terminal: `ngrok http 3000` |
| 4. Set URL in .env | `API_BASE_URL=https://YOUR-NGROK-URL` |
| 5. Restart server | So frontend gets the injected URL for Telegram |
| 6. BotFather | Set Mini App URL to the Ngrok HTTPS URL |

---

## 5. Summary

- **Frontend:** Served from your machine (port 3000), optionally exposed by Ngrok.
- **Backend:** Always **https://api.bahirandelivery.cloud/** (login, restaurants, menu, orders, getMe, etc.). No need to run a separate backend locally.
