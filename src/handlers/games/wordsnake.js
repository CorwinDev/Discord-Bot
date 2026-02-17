const Discord = require('discord.js');

const Schema = require("../../database/models/wordsnake");

module.exports = async (client) => {
  client.on(Discord.Events.MessageCreate, async (message) => {
    if (message.author.bot || message.channel.type === Discord.ChannelType.DM) return;

    Schema.findOne({ Guild: message.guild.id, Channel: message.channel.id }, async (err, data) => {
      if (data) {
        try {
          if (!data.lastWord || data.lastWord == " ") {
            message.react(client.emotes.normal.check);

            var word = message.content;

            data.lastWord = word;
            data.save();
            return;
          }

          const result = data.lastWord.split('');
          let number = result.length - 1;

          if (message.content.toLowerCase().startsWith(result[number].toLowerCase())) {
            message.react(client.emotes.normal.check);

            var word = message.content.replace(" ", "");

            data.lastWord = word;
            data.save();
            return;
          }
          else {
            return message.react(client.emotes.normal.error);
          }
        }
        catch (err) {
          console.log(err);
        }
      }
    })
  }).setMaxListeners(0);
}