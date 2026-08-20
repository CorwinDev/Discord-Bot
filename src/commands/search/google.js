const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let name = encodeURIComponent(interaction.options.getString("name"));
  let link = `https://www.google.com/search?q=${name}`;

  client.succNormal(
    {
      text: `I have found the following for: \`${name}\``,
      fields: [
        {
          name: `🔗┇Link`,
          value: `[Click here to see the link](${link})`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
