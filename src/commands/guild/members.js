const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
  const members = await interaction.guild.members.fetch();

  client.embed({
    title: `👤・Membercount`,
    desc: `View the total number of members in the server`,
    fields: [
      {
        name: `👤┆Members`,
        value: `${members.filter(member => !member.user.bot).size} members`,
        inline: true
      },
      {
        name: `🤖┆Bots`,
        value: `${members.filter(member => member.user.bot).size} bots`,
        inline: true
      },
      {
        name: `📘┆Total`,
        value: `${interaction.guild.memberCount} members`,
        inline: true
      }
    ],
    type: 'editreply'
  }, interaction)
}

   