import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8970650090:AAH_NjEYYcnRHw2iegpCIIF6tNvonoGSivc';
const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:5173';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let viteProcess = null;

// Helper to make Telegram API requests using native fetch
async function tgApi(method, body = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`Error calling ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

// Configure Bot Menu Button in Telegram Chat
async function setupMenuButton() {
  if (!MINI_APP_URL.startsWith('https://')) {
    console.log('⚠️  Note: Telegram WebApps require HTTPS for inline buttons & menu button.');
    console.log('   Current MINI_APP_URL is:', MINI_APP_URL);
    console.log('   To connect to Telegram mobile client, update MINI_APP_URL in .env to an https:// URL (e.g. ngrok or deployed site).\n');
    return;
  }

  const res = await tgApi('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Open Mini App',
      web_app: { url: MINI_APP_URL },
    },
  });
  if (res.ok) {
    console.log('✅ Telegram Menu Button configured successfully!');
  } else {
    console.warn('⚠️ Menu Button configuration output:', res.description || res);
  }
}

// Handle incoming messages from Telegram users
async function handleUpdate(update) {
  if (!update.message || !update.message.chat) return;

  const chatId = update.message.chat.id;
  const text = update.message.text || '';
  const firstName = update.message.from?.first_name || 'Friend';

  console.log(`📩 [Bot] Received message from ${firstName} (${chatId}): "${text}"`);

  const replyMarkup = MINI_APP_URL.startsWith('https://')
    ? {
        inline_keyboard: [
          [
            {
              text: '🛍️ Open HiShop Mini App',
              web_app: { url: MINI_APP_URL },
            },
          ],
        ],
      }
    : undefined;

  const messageText = `👋 Hello ${firstName}!\n\nWelcome to **HiShop** Telegram Mini App.` +
    (MINI_APP_URL.startsWith('https://')
      ? `\n\nTap the button below to launch the Mini App!`
      : `\n\nMini App URL: ${MINI_APP_URL}\n*(Note: Telegram requires HTTPS for inline web_app buttons)*`);

  await tgApi('sendMessage', {
    chat_id: chatId,
    text: messageText,
    parse_mode: 'Markdown',
    reply_markup: replyMarkup,
  });
}

// Long polling loop
let offset = 0;
async function pollUpdates() {
  while (true) {
    try {
      const res = await tgApi('getUpdates', { offset, timeout: 30 });
      if (res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// Start Vite Dev Server for the Telegram Mini App
function startViteServer() {
  if (process.argv.includes('--no-vite')) return;

  console.log('🚀 Starting Vite Dev Server for Mini App...');
  viteProcess = spawn('npx', ['vite', '--host'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  viteProcess.on('error', (err) => {
    console.error('Vite process error:', err);
  });
}

async function main() {
  console.log('==================================================');
  console.log('🤖 Telegram Bot & Mini App Runner');
  console.log('==================================================');

  // Verify Bot Token
  const botInfo = await tgApi('getMe');
  if (!botInfo.ok) {
    console.error('❌ Failed to authenticate Telegram Bot. Check TELEGRAM_BOT_TOKEN.');
    process.exit(1);
  }

  console.log(`🤖 Bot Authenticated: @${botInfo.result.username} (${botInfo.result.first_name})`);
  console.log(`📱 Target Mini App URL: ${MINI_APP_URL}`);

  await setupMenuButton();
  startViteServer();

  console.log('📡 Bot listener started! Send /start to @' + botInfo.result.username + ' in Telegram.');
  console.log('Press Ctrl+C to stop.\n');
  pollUpdates();
}

// Cleanup child process on exit
process.on('SIGINT', () => {
  console.log('\nStopping bot and dev server...');
  if (viteProcess) viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (viteProcess) viteProcess.kill();
  process.exit(0);
});

main();
