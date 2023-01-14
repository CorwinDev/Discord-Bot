const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
  const perms = await client.checkPerms({
    flags: [Discord.Permissions.FLAGS.MANAGE_EMOJIS],
    perms: ["MANAGE_EMOJIS"]
  }, interaction)
  
  if (perms == false) return;

  const rawEmoji = interaction.options.getString('emoji');
  const parsedEmoji = Discord.Util.parseEmoji(rawEmoji);

  if (parsedEmoji.id) {
    const extension = parsedEmoji.animated ? ".gif" : ".png";
    const url = `https://cdn.discordapp.com/emojis/${parsedEmoji.id + extension}`;

    interaction.guild.emojis.create(url, parsedEmoji.name).then(emoji => {
      client.succNormal({
        text: `Emoji successfully added to the server`,
        fields: [
          {
            name: "😛┇Emoji",
            value: `${emoji}`,
            inline: true,
          },
          {
            name: "😜┇Emoji name",
            value: `${emoji.name}`,
            inline: true,
          },
          {
            name: "😝┇Emoji id",
            value: `${emoji.id}`,
            inline: true,
          },
        ],
        type: 'editreply'
      }, interaction)
    })
  }
  else {
    client.errNormal({
      error: "Emoji not found!",
      type: 'editreply'
    }, interaction)
  }
}

   