const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  client.embed(
    {
      title: `📘・Owner information`,
      desc: `____________________________`,
      thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
      fields: [
        {
          name: "👑┆Owner name",
          value: `Corwin`,
          inline: true,
        },
        {
          name: "🏷┆Discord tag",
          value: `</Corwin>#0001`,
          inline: true,
        },
        {
          name: "🏢┆Organization",
          value: `CoreWare`,
          inline: true,
        },
        {
          name: "🌐┆Website",
          value: `[https://corwindev.nl](https://corwindev.nl)`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
