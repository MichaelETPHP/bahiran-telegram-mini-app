# Project folder structure

```
bahiran-mini-app/
├── frontend/                 Mini App UI (HTML, CSS, JS, assets)
│   ├── index.html            Main app entry (single-page Mini App)
│   └── image/                Static assets (e.g. logo.png)
│
├── api/                      Backend (Node.js – one server for API + frontend)
│   ├── package.json          Scripts and metadata for the server
│   ├── server.js             HTTP server: API routes + serves frontend/ on GET
│   └── data/                 Created at runtime (e.g. logins.json)
│
├── Doc/                      Documentation
│   ├── STRUCTURE.md          This file – project folder structure
│   ├── README.md             Project overview and quick start
│   └── TESTING.md            How to run and test with Ngrok
│
├── .env                      Environment variables (BOT_TOKEN, PORT)
├── .gitignore                Ignore node_modules, .env, api/data
└── README.md                 Short intro – see Doc/ for full docs
```

## What lives where

| Path | Purpose |
|------|---------|
| `frontend/` | All static files for the Mini App. Served by `api/server.js` for requests that are not under `/api/`. |
| `api/server.js` | Single server: handles `/api/health`, `/api/auth/telegram`, and serves `frontend/` for other GET requests. |
| `api/data/` | Runtime data (e.g. login records). Created automatically. Not in git. |
| `Doc/` | All markdown documentation. |
| `.env` | Secrets and config (BOT_TOKEN, PORT). Not in git. |

## How to run

From the `api/` folder:

```bash
cd api
npm start
```

Server listens on port **3000** (or `PORT` from `.env`). Open http://localhost:3000 for the app.
