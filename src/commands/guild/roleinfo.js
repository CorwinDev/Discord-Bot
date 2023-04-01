const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
  const role = interaction.options.getRole('role');
  const perms = role.permissions.toArray();

  client.embed({
    title: `ℹ️・Role information`,
    thumbnail: interaction.guild.iconURL({ dynamic: true, size: 1024 }),
    desc: `Information about the role ${role}`,
    fields: [
      {
        name: 'Role ID:',
        value: `${role.id}`,
        inline: true
      },
      {
        name: 'Role Name:',
        value: `${role.name}`,
        inline: true
      },
      {
        name: 'Mentionable:',
        value: `${role.mentionable ? 'Yes' : 'No'}`,
        inline: true
      },
      {
        name: 'Role Permissions:',
        value: `${perms.join(', ')}`
      }
    ],
    type: 'editreply'
  }, interaction)
}

   