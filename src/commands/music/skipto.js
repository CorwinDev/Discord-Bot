const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const player = client.player.players.get(interaction.guild.id);

  const channel = interaction.member.voice.channel;
  if (!channel)
    return client.errNormal(
      {
        error: `You're not in a voice channel!`,
        type: "editreply",
      },
      interaction,
    );

  if (player && channel.id !== player?.voiceId)
    return client.errNormal(
      {
        error: `You're not in the same voice channel!`,
        type: "editreply",
      },
      interaction,
    );

  if (!player || !player.queue.current)
    return client.errNormal(
      {
        error: "There are no songs playing in this server",
        type: "editreply",
      },
      interaction,
    );

  let number = interaction.options.getNumber("number");

  player.queue.splice(0, parseInt(number) - 1);
  player.skip();

  client.succNormal(
    {
      text: `Skipped the music to **${number}**`,
      type: "editreply",
    },
    interaction,
  );
};
