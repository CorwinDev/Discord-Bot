const Discord = require("discord.js");
const generator = require("generate-password");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const password = generator.generate({
    length: 12,
    symbols: true,
    numbers: true,
  });

  client.succNormal(
    {
      text: `I have generate a password and have it sent to your DM`,
      type: "editreply",
    },
    interaction,
  );

  client.succNormal(
    {
      text: `Your generated password`,
      fields: [
        {
          name: "🔑┇Password",
          value: `${password}`,
          inline: true,
        },
        {
          name: "👣┇Length",
          value: `12`,
          inline: true,
        },
      ],
    },
    interaction.user,
  );
};
