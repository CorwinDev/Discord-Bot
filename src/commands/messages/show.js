const Discord = require("discord.js");

const Schema = require("../../database/models/messages");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let user = interaction.options.getUser("user") || interaction.user;

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        client.embed(
          {
            title: "💬・Messages",
            desc: `**${user.tag}** has \`${data.Messages}\` messages`,
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.embed(
          {
            title: "💬・Messages",
            desc: `**${user.tag}** has \`0\` messages`,
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
