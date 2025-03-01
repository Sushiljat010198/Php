const { Telegraf } = require("telegraf");
const express = require("express");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.BOT_TOKEN); // Render me BOT_TOKEN env variable set karein
const app = express();
const PORT = process.env.PORT || 3000;

// Public folder for PHP files
app.use(express.static("public"));

// Bot command
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
  const liveLink = `https://your-app-name.onrender.com/public/${fileName}`;
  ctx.reply(`Aapka PHP code live hai: ${liveLink}\nClick karne par execute hoga.`);
});

bot.launch();

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
