const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    const emoji = interaction.options.getString('emoji');
    const parsedEmoji = Discord.parseEmoji(emoji)

    if (parsedEmoji) {
        const ex = parsedEmoji.animated ? ".gif" : ".png";
        const url = `https://cdn.discordapp.com/emojis/${parsedEmoji.id + ex}`;

        return client.embed({
            image: url,
            type: 'editreply'
        }, interaction)
    } else {
        client.errNormal({ error: "Please supply a valid emoji!", type: 'editreply' }, interaction)
    }
}

 