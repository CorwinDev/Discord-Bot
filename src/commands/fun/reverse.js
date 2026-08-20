const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const text = interaction.options.getString("text");

  client.succNormal(
    {
      text: `${text.split("").reverse().join("")}`,
      type: "editreply",
    },
    interaction,
  );
};
