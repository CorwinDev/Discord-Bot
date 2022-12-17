const Discord = require('discord.js');
module.exports = async (client, interaction, args) => {
    client.embed({
        title: `🖼・Server Icon`,
        image: interaction.guild.iconURL({ dynamic: true, size: 1024 }),
        type: 'editreply'
    }, interaction)
}