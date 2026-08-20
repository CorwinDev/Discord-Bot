const Discord = require("discord.js");

const Schema = require("../../database/models/stats");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let tier = {
    TIER_1: `1`,
    TIER_2: `2`,
    TIER_3: `3`,
    NONE: `0`,
  };

  var channelName = await client.getTemplate(interaction.guild);
  channelName = channelName.replace(`{emoji}`, "🥇");
  channelName = channelName.replace(
    `{name}`,
    `Tier: ${tier[interaction.guild.premiumTier] || "0"}`,
  );

  await interaction.guild.channels
    .create({
      name: channelName,
      type: Discord.ChannelType.GuildVoice,
      permissionOverwrites: [
        {
          deny: [Discord.PermissionsBitField.Flags.Connect],
          id: interaction.guild.id,
        },
      ],
    })
    .then(async (channel) => {
      Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
        if (data) {
          data.BoostTier = channel.id;
          data.save();
        } else {
          new Schema({
            Guild: interaction.guild.id,
            BoostTier: channel.id,
          }).save();
        }
      });

      client.succNormal(
        {
          text: `Tier count created!`,
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
};
