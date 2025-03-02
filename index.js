const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

// Environment Variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : "http://localhost:3000";

// Check if BOT_TOKEN is defined
if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN is not defined. Please set it in the Secrets tab.");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

// Create php_files directory if it doesn't exist
const phpFilesDir = path.join(__dirname, 'php_files');
if (!fs.existsSync(phpFilesDir)) {
    fs.mkdirSync(phpFilesDir, { recursive: true });
}

// Middleware to serve PHP files dynamically
app.get("/:filename", (req, res) => {
    const filePath = path.join(phpFilesDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        exec(`php ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                res.send(`<pre>Error: ${stderr}</pre>`);
            } else {
                res.send(`<pre>${stdout}</pre>`);
            }
        });
    } else {
        res.status(404).send("File not found.");
    }
});

// Simple home route
app.get("/", (req, res) => {
    res.send("Telegram PHP Bot is running!");
});

// Start Express Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Base URL: ${BASE_URL}`);

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "Send me a PHP code, and I'll execute it for you!");
    });

    bot.on("message", async (msg) => {
        if (msg.text && msg.text.startsWith("<?php")) {
            const filename = `code_${msg.chat.id}_${Date.now()}.php`;
            const filePath = path.join(phpFilesDir, filename);

            fs.writeFileSync(filePath, msg.text);

            const phpUrl = `${BASE_URL}/${filename}`;
            bot.sendMessage(msg.chat.id, `Your PHP code is running at: ${phpUrl}`);
        } else if (msg.text && !msg.text.startsWith("/")) {
            bot.sendMessage(msg.chat.id, "Please send PHP code starting with <?php");
        }
    });
});
