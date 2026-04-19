# Bahiran Delivery – Mini App

Telegram Mini App for food delivery. One Node.js server serves both the frontend and the API.

## Environment (.env)

Create or edit `.env` in the project root. All config is read from here (local and deployment):

| Variable       | Description |
|----------------|-------------|
| `PORT`         | Server port (default: 3000). |
| `API_BASE_URL` | Base URL for the Mini App (e.g. your Ngrok URL). Injected into frontend. |
| `BAHIRAN_API_BASE_URL` | Bahiran backend API base (default: https://api.bahirandelivery.cloud). Used for login (Get Token by Telegram ID) and orders. |
| `BOT_TOKEN`    | Telegram Bot token (for bot and optional legacy auth). |
| `MONGODB_URI`  | MongoDB connection string (for migrations and bot user storage). |

Example:

```env
PORT=3000
API_BASE_URL=https://your-ngrok-url.ngrok-free.dev
BAHIRAN_API_BASE_URL=https://api.bahirandelivery.cloud
BOT_TOKEN=your_bot_token
MONGODB_URI=mongodb+srv://...
```

**Login:** The Mini App gets a JWT by calling the backend **Get Token by Telegram ID** (`POST /api/v1/users/auth/telegram-token` with `{ "telegramId": "..." }`). Telegram user ID comes from the Web App when opened in Telegram; otherwise default ID is used. The token is then used for Orders and other protected endpoints.

## Quick start

**Option A – API only (serves frontend):**
```bash
cd api
npm start
```

**Option B – API + Bot together (ask users for phone, save to MongoDB):**
```bash
npm run start:all
```
From project root: starts both the API server and the Telegram bot. Users can message the bot, tap **Share Phone Number**, then open the Mini App.

- **App:** http://localhost:PORT/ (e.g. http://localhost:3000/)
- **API:** http://localhost:PORT/api/health , POST http://localhost:PORT/api/auth/telegram
- **Bot:** `bot/bot.js` – /start shows keyboard with "Share Phone" and "Open Bahiran App"; contact is saved to MongoDB `users`.

## Docs

- **[STRUCTURE.md](STRUCTURE.md)** – Project folder structure
- **[TESTING.md](TESTING.md)** – How to test with Ngrok and Telegram

## Tech

- **Frontend:** Single HTML file (`frontend/index.html`) with inline CSS/JS; Telegram Web App SDK.
- **Backend:** Node.js HTTP server in `api/server.js` – validates Telegram initData, collects login data, serves `frontend/` for GET requests.
