const Discord = require("discord.js");

const forHumans = require("../../assets/utils/forhumans.js");

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

  let number = interaction.options.getNumber("time");
  player.seek(Number(number) * 1000);

  const musicLength = player.queue.current.isStream
    ? null
    : !player.queue.current ||
        !player.queue.current.length ||
        isNaN(player.queue.current.length)
      ? null
      : player.queue.current.length;
  const nowTime =
    !player.position || isNaN(player.position) ? null : player.position;

  const bar = await createProgressBar(musicLength, nowTime);

  client.succNormal(
    {
      text: `Seeked song to: ${format(Number(number) * 1000)}`,
      fields: [
        {
          name: `${client.emotes.normal.music}┆Progress`,
          value:
            `${new Date(player.position).toISOString().slice(11, 19)} ┃ ` +
            bar +
            ` ┃ ${new Date(player.queue.current.length).toISOString().slice(11, 19)}`,
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};

async function createProgressBar(
  total,
  current,
  size = 10,
  line = "▬",
  slider = "🔘",
) {
  if (current > total) {
    const bar = line.repeat(size + 2);
    const percentage = (current / total) * 100;
    return [bar, percentage];
  } else {
    const percentage = current / total;
    const progress = Math.round(size * percentage);

    if (progress > 1 && progress < 10) {
      const emptyProgress = size - progress;
      const progressText = line.repeat(progress).replace(/.$/, slider);
      const emptyProgressText = line.repeat(emptyProgress);
      const bar = progressText + emptyProgressText;
      return [bar];
    } else if (progress < 1 || progress == 1) {
      const emptyProgressText = line.repeat(9);
      const bar = "🔘" + emptyProgressText;
      return [bar];
    } else if (progress > 10 || progress == 10) {
      const emptyProgressText = line.repeat(9);
      const bar = emptyProgressText + "🔘";
      return [bar];
    }
  }
}

function format(millis) {
  try {
    var h = Math.floor(millis / 3600000),
      m = Math.floor(millis / 60000),
      s = ((millis % 60000) / 1000).toFixed(0);
    if (h < 1) return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    else
      return (
        (h < 10 ? "0" : "") +
        h +
        ":" +
        (m < 10 ? "0" : "") +
        m +
        ":" +
        (s < 10 ? "0" : "") +
        s
      );
  } catch (e) {
    console.log(String(e.stack).bgRed);
  }
}
