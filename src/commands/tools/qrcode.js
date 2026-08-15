const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const text = interaction.options.getString("text");

  client.embed(
    {
      title: `📱・Qrcode`,
      image: `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&data=${text.replace(new RegExp(" ", "g"), "%20")}`,
      type: "editreply",
    },
    interaction,
  );
};
