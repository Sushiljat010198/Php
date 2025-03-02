const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");

// Environment Variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 10000;
const BASE_URL = "https://YOUR-RENDER-APP.onrender.com";  // Replace this after deployment

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

// Middleware to serve PHP files dynamically
app.get("/:filename", (req, res) => {
    const filePath = `./php_files/${req.params.filename}`;
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

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "Send me a PHP code, and I'll execute it for you!");
    });

    bot.on("message", async (msg) => {
        if (msg.text && msg.text.startsWith("<?php")) {
            const filename = `code_${msg.chat.id}_${Date.now()}.php`;
            const filePath = `./php_files/${filename}`;

            fs.writeFileSync(filePath, msg.text);

            const phpUrl = `${BASE_URL}/${filename}`;
            bot.sendMessage(msg.chat.id, `Your PHP code is running at: ${phpUrl}`);
        }
    });
});
