const Discord = require("discord.js");
const sourcebin = require("sourcebin");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const language = interaction.options.getString("language");
  const code = interaction.options.getString("code");

  const bin = await sourcebin
    .create(
      [
        {
          content: `${code}`,
          language: `${language}`,
        },
      ],
      {
        title: "💻・Random Code",
        description: "This is code was uploaded via Bot",
      },
    )
    .then((value) => {
      client.succNormal(
        {
          text: `Your code has been posted!`,
          fields: [
            {
              name: `🔗┇Link`,
              value: `[Click here to see your code](${value.url})`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    });
};
