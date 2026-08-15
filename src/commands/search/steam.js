const Discord = require("discord.js");
const pop = require("popcat-wrapper");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  await interaction.deferReply({ fetchReply: true });

  const name = interaction.options.getString("name");

  const s = await pop.steam(name).catch((e) => {
    return client.errNormal(
      {
        error: "Application not found!",
        type: "editreply",
      },
      interaction,
    );
  });

  await client.embed(
    {
      title: `🎮・${s.name}`,
      thumbnail: s.thumbnail,
      fields: [
        {
          name: `💬┇Name`,
          value: `${s.name}`,
          inline: true,
        },
        {
          name: `📃┇Capital`,
          value: `${s.description}`,
          inline: false,
        },
        {
          name: "💻┇Developers",
          value: `${s.developers.join(", ")}`,
          inline: true,
        },
        {
          name: "☁┇Publishers",
          value: `${s.publishers.join(", ")}`,
          inline: true,
        },
        {
          name: "🪙┇Price",
          value: `${s.price}`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
