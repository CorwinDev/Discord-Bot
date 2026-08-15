const Discord = require("discord.js");

const Schema = require("../../database/models/stickymessages");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const channel = interaction.options.getChannel("channel");

  Schema.findOne({ Guild: interaction.guild.id, Channel: channel.id }).then(
    async (data) => {
      if (data) {
        Schema.findOneAndDelete({
          Guild: interaction.guild.id,
          Channel: channel.id,
        }).then(() => {
          client.succNormal(
            {
              text: "Sticky message deleted",
              fields: [
                {
                  name: `📘┆Channel`,
                  value: `${channel}`,
                },
              ],
              type: "editreply",
            },
            interaction,
          );
        });
      } else {
        client.errNormal(
          {
            error: "No message found!",
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
