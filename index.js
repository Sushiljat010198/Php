
const { Telegraf } = require("telegraf");
const express = require("express");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const PORT = 3000;

// Public folder for PHP files
app.use(express.static("public"));

// Telegram bot command to receive PHP code
bot.start((ctx) => {
  ctx.reply("Mujhe PHP code bhejo, main usko host karke ek live link doonga.");
});

bot.on("text", async (ctx) => {
  const phpCode = ctx.message.text;
  const fileName = `file_${Date.now()}.php`;
  const filePath = path.join(__dirname, "public", fileName);

  // Save PHP code to a file
  fs.writeFileSync(filePath, phpCode);

  // Generate the live link
  const liveLink = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/${fileName}`;
  ctx.reply(`Aapka PHP code live hai: ${liveLink}\nClick karne par execute hoga.`);
});

// Express route for serving PHP files
app.get('/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  if (fileName.endsWith('.php')) {
    res.setHeader('Content-Type', 'text/html');
    const filePath = path.join(__dirname, 'public', fileName);
    if (fs.existsSync(filePath)) {
      res.send(fs.readFileSync(filePath, 'utf8'));
    } else {
      res.status(404).send('File not found');
    }
  } else {
    res.status(404).send('Not found');
  }
});

bot.launch();

// Start the Express server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
