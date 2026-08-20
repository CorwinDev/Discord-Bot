const Discord = require("discord.js");

const Schema = require("../../database/models/invites");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const rawLeaderboard = await Schema.find({
    Guild: interaction.guild.id,
  }).sort([["Invites", "descending"]]);

  if (!rawLeaderboard)
    return client.errNormal(
      {
        error: `No data found!`,
        type: "editreply",
      },
      interaction,
    );

  const lb = rawLeaderboard.map(
    (e) =>
      `**${rawLeaderboard.findIndex((i) => i.Guild === interaction.guild.id && i.User === e.User) + 1}** | <@!${e.User}> - Invites: \`${e.Invites}\``,
  );

  await client.createLeaderboard(
    `📨・Invites - ${interaction.guild.name}`,
    lb,
    interaction,
  );
};
