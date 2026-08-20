const Discord = require("discord.js");

const Schema = require("../../database/models/invites");

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
            title: "📨・Invites",
            desc: `**${user.tag}** has \`${data.Invites}\` invites`,
            fields: [
              {
                name: "Total",
                value: `${data.Total}`,
                inline: true,
              },
              {
                name: "Left",
                value: `${data.Left}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.embed(
          {
            title: "📨・Invites",
            desc: `**${user.tag}** has \`0\` invites`,
            fields: [
              {
                name: "Total",
                value: `0`,
                inline: true,
              },
              {
                name: "Left",
                value: `0`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
