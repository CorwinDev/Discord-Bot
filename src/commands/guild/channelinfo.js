const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
  const channel = interaction.options.getChannel('channel');

  client.embed({
      title: `ℹ・Channel information`,
      desc: `Channel information about: <#${channel.id}>`,
      fields: [
          {
              name: "Type",
              value: `${channel.type}`,
              inline: true,
          },
          {
              name: "ID",
              value: `${channel.id}`,
              inline: true,
          },
          {
              name: "Type",
              value: `${channel.type}`,
              inline: true,
          },
          {
              name: "Made on",
              value: `${channel.createdAt}`,
              inline: true,
          },
          {
              name: "Subject",
              value: `${channel.topic ? channel.topic : 'N/A'}`,
              inline: true,
          },
          {
              name: "NSFW",
              value: `${channel.nsfw}`,
              inline: true,
          },
          {
              name: "Parent",
              value: `${channel.parentID ? channel.parentID : 'N/A'}`,
              inline: true,
          },
      ],
      type: 'editreply'
  }, interaction)
}

   