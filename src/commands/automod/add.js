const Discord = require("discord.js");

const Schema = require("../../database/models/blacklist");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const word = interaction.options.getString("word");

  Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (data) {
      if (data.Words.includes(word)) {
        return client.errNormal(
          {
            error: `That word is already exists in the database!`,
            type: "editreply",
          },
          interaction,
        );
      }
      if (!data.Words) data.Words = [];
      data.Words.push(word);
      data.save();
    } else {
      new Schema({
        Guild: interaction.guild.id,
        Words: word,
      }).save();
    }
  });

  client.succNormal(
    {
      text: `Word is now blacklisted!`,
      fields: [
        {
          name: `💬┆Word`,
          value: `${word}`,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
