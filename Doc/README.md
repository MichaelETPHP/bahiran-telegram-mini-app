# Bahiran Delivery – Mini App

Telegram Mini App for food delivery. One Node.js server serves both the frontend and the API.

## Environment (.env)

Create or edit `.env` in the project root. All config is read from here (local and deployment):

| Variable       | Description |
|----------------|-------------|
| `PORT`         | Server port (default: 3000). |
| `API_BASE_URL` | Base URL for API calls from the frontend (e.g. your Ngrok URL). Leave empty for same-origin. |
| `BOT_TOKEN`    | Telegram Bot token (required for Mini App login). |

Example:

```env
PORT=3000
API_BASE_URL=https://your-ngrok-url.ngrok-free.dev
BOT_TOKEN=your_bot_token
```

The server injects `API_BASE_URL` into the frontend when serving `index.html`, so the app uses it automatically.

## Quick start

```bash
cd api
npm start
```

- **App:** http://localhost:PORT/ (e.g. http://localhost:3000/)
- **API:** http://localhost:PORT/api/health , POST http://localhost:PORT/api/auth/telegram

## Docs

- **[STRUCTURE.md](STRUCTURE.md)** – Project folder structure
- **[TESTING.md](TESTING.md)** – How to test with Ngrok and Telegram

## Tech

- **Frontend:** Single HTML file (`frontend/index.html`) with inline CSS/JS; Telegram Web App SDK.
- **Backend:** Node.js HTTP server in `api/server.js` – validates Telegram initData, collects login data, serves `frontend/` for GET requests.
