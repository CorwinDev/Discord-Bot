const Discord = require("discord.js");

module.exports = async (client, message) => {
  const dmlog = new Discord.WebhookClient({
    id: client.webhooks.dmLogs.id,
    token: client.webhooks.dmLogs.token,
  });

  if (message.author.bot) return;

const triggerWords = ['banana', 'fire', 'white'];
  triggerWords.forEach((word) => {
    if (message.content.includes(word)) {
      message.reply(message.content);
    }
  });
};

