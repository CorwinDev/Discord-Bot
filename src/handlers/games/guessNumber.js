const discord = require('discord.js');

const Schema = require("../../database/models/guessNumber");

module.exports = async (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.type === 'DM') return;

    const data = await Schema.findOne({ Guild: message.guild.id, Channel: message.channel.id })
    if (data) {
      let number = parseInt(data.Number);
      let userNumber = parseInt(message.content);
      if (!userNumber) return;

      if (userNumber == number) {
        message.react(client.emotes.normal.check);
        let number = Math.ceil(Math.random() * 10000);

        let amount = Math.floor(Math.random() * 100) + 1;
        client.addMoney(message, message.author, amount);

        client.embed({
          title: `🔢・Guess the number`,
          desc: `The number is guessed and has a value of $${amount}`,
          fields: [
            {
              name: `👤┇Guessed by`,
              value: `${message.author} (${message.author.tag})`,
              inline: true
            },
            {
              name: `🔢┇Correct number`,
              value: `${data.Number}`,
              inline: true
            }
          ]
        }, message.channel);

        data.Number = number;
        data.save();

        client.embed({
          title: `🔢・Guess the number`,
          desc: `Guess the number between **1** and **10.000**!`
        }, message.channel)
      }
      else if (userNumber > number) {
        return message.react(client.emotes.normal.arrowDown);
      }
      else if (userNumber < number) {
        return message.react(client.emotes.normal.arrowUp);
      }
    }
  }).setMaxListeners(0);
}