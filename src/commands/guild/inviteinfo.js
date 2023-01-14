const Discord = require('discord.js');
const axios = require("axios");

const model = require('../../database/models/badge');

module.exports = async (client, interaction, args) => {
  const invite = interaction.options.getString('invite');

  const verifyFlags = {
    0: `Unrestricted`,
    1: `Must have verified email on account`,
    2: `Must be registered on Discord for longer than 5 minutes`,
    3: `Must be a member of the server for longer than 10 minutes`,
    4: `Must have a verified phone number`
  }

  axios.get(`https://discord.com/api/v9/invites/${encodeURIComponent(invite)}`).catch(async () => {
    return client.errNormal({
      error: "I couldn't find the server",
      type: 'editreply'
    }, interaction)
  }).then(async (raw) => {
    const { data } = raw;
    if (!data) return;

    let guildTimestamp = (await toUnix(data.guild.id)).timestamp;
    let channelTimestamp = (await toUnix(data.channel.id)).timestamp;

    return client.embed({
      title: `📨・Invite information`,
      thumbnail: `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=1024`,
      image: `https://cdn.discordapp.com/banners/${data.guild.id}/${data.guild.banner}.png?size=1024`,
      fields: [
        {
          name: "Server Name",
          value: `${data.guild.name}`,
          inline: true,
        },
        {
          name: "Server ID",
          value: `${data.guild.id}`,
          inline: true,
        },
        {
          name: "Server Created",
          value: `<t:${guildTimestamp}>`,
          inline: true,
        },
        {
          name: "Channel Name",
          value: `${data.channel.name}`,
          inline: true,
        },
        {
          name: "Channel ID",
          value: `${data.channel.id}`,
          inline: true,
        },
        {
          name: "Channel Created",
          value: `<t:${channelTimestamp}>`,
          inline: true,
        },
        {
          name: "Server Images",
          value: `${data.guild.icon && data.guild.banner && data.guild.splash ? `` : `No data`}
          ${data.guild.icon ? `[Server Icon](https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=4096)` : ``}
          ${data.guild.banner ? `[Server Banner](https://cdn.discordapp.com/banners/${data.guild.id}/${data.guild.banner}.png?size=4096)` : ``}`,
          inline: true,
        },
        {
          name: "Server Verification Level",
          value: `${verifyFlags[data.guild.verification_level]}`,
          inline: true,
        },
      ],
      type: 'editreply'
    }, interaction)
  })
}

const toUnix = (snowflake) => {
  const EPOCH = 1420070400000;
  const BINARY = idToBinary(snowflake.toString()).toString(2).padStart(64, '0');
  let timestamp = parseInt(((parseInt(BINARY.substring(0, 42), 2) + EPOCH).toString().substring(0, (parseInt(BINARY.substring(0, 42), 2) + EPOCH).toString().length - 3)));
  let timestampms = parseInt(BINARY.substring(0, 42), 2) + EPOCH;
  const date = new Date(timestampms);
  const data = {
    timestamp,
    timestampms,
    date
  }
  return data
}

const idToBinary = (num) => {
  let bin = '';
  let high = parseInt(num.slice(0, -10)) || 0;
  let low = parseInt(num.slice(-10));
  while (low > 0 || high > 0) {
    bin = String(low & 1) + bin;
    low = Math.floor(low / 2);
    if (high > 0) {
      low += 5000000000 * (high % 2);
      high = Math.floor(high / 2);
    }
  }
  return bin;
}

   