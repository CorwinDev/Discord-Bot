const Discord = require("discord.js");
const axios = require("axios");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const url = interaction.options.getString("site");
  const code = interaction.options.getString("code");

  try {
    const { data: res } = await axios.get("https://is.gd/create.php", {
      params: {
        format: "simple",
        url,
        shorturl: code,
      },
    });

    if (res.startsWith("Error"))
      return client.errNormal(
        {
          error: `${res.replace("Error: ", "")}`,
          type: "editreply",
        },
        interaction,
      );

    client.succNormal(
      {
        text: `Your shortened url has been created!`,
        fields: [
          {
            name: `🔗┇Link`,
            value: `${res}`,
            inline: true,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  } catch (error) {
    return client.errNormal(
      {
        error: error.response?.data || error.message,
        type: "editreply",
      },
      interaction,
    );
  }
};
