const Discord = require("discord.js");

const Schema = require("../../database/models/afk");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const reason = interaction.options.getString("reason") || `Not specified`;

  Schema.findOne({
    Guild: interaction.guild.id,
    User: interaction.user.id,
  }).then(async (data) => {
    if (data) {
      return client.errNormal(
        {
          error: `You're already afk!`,
          type: "editreply",
        },
        interaction,
      );
    } else {
      new Schema({
        Guild: interaction.guild.id,
        User: interaction.user.id,
        Message: reason,
      }).save();

      if (!interaction.member.displayName.includes(`[AFK] `)) {
        interaction.member
          .setNickname(`[AFK] ` + interaction.member.displayName)
          .catch((e) => {});
      }

      client.succNormal(
        {
          text: `Your AFK has been set up successfully`,
          type: "ephemeraledit",
        },
        interaction,
      );

      client.embed(
        {
          desc: `${interaction.user} is now afk! **Reason:** ${reason}`,
        },
        interaction.channel,
      );
    }
  });
};
