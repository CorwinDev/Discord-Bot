const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
  const perms = await client.checkPerms({
    flags: [Discord.Permissions.FLAGS.BAN_MEMBERS],
    perms: ["BAN_MEMBERS"]
  }, interaction)

  if (perms == false) return;

  interaction.guild.members.unban(interaction.options.getString('user')).then(function () {
    client.succNormal({
      text: "The specified user has been successfully unbanned!",
      fields: [
        {
          name: "👤┆User",
          value: member.user.tag,
          inline: true
        }
      ],
      type: 'editreply'
    }, interaction);
  }).catch(function () {
    return client.errNormal({
      error: `I could not find the user!`,
      type: 'editreply'
    }, interaction);
  });
}

 