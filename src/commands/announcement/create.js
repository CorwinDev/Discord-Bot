const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const message = interaction.options.getString("message");
  const channel = interaction.options.getChannel("channel");

  client.embed(
    {
      title: `📢・Announcement!`,
      desc: message,
    },
    channel,
  );

  client.succNormal(
    {
      text: `Announcement has been sent successfully!`,
      fields: [
        {
          name: `📘┆Channel`,
          value: `${channel} (${channel.name})`,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
