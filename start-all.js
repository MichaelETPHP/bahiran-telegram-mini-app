/**
 * Start API server + Telegram bot together.
 * Run from project root: node start-all.js  (or npm run start:all)
 */
const { spawn } = require('child_process');
const path = require('path');

const root = __dirname;

const api = spawn(process.execPath, [path.join(root, 'api', 'server.js')], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env },
});
const bot = spawn(process.execPath, [path.join(root, 'bot', 'bot.js')], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env },
});

api.on('error', (err) => console.error('[start-all] API failed:', err));
bot.on('error', (err) => console.error('[start-all] Bot failed:', err));
api.on('exit', (code) => code !== null && code !== 0 && console.error('[start-all] API exited:', code));
bot.on('exit', (code) => code !== null && code !== 0 && console.error('[start-all] Bot exited:', code));

function killAll() {
  api.kill();
  bot.kill();
  process.exit(0);
}
process.on('SIGINT', killAll);
process.on('SIGTERM', killAll);

console.log('[start-all] API + Bot started. Press Ctrl+C to stop both.\n');
