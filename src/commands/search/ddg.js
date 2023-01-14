const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    let name = encodeURIComponent(interaction.options.getString('name'));
    let link = `https://duckduckgo.com/?q=${name}`;

    client.succNormal({
        text: `I have found the following for: \`${name}\``,
        fields: [
            {
                name: `🔗┇Link`,
                value: `[Click here to see the link](${link})`,
                inline: true,
            }
        ], type: 'editreply'
    }, interaction);

}

 