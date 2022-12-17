const Discord = require('discord.js');
module.exports = async (client, interaction, args) => {
    if (interaction.guild.banner) {
        client.embed({
            title: `🖼・Server Banner`,
            image: interaction.guild.bannerURL({ dynamic: true, size: 1024 }),
            type: 'editreply'
        }, interaction)
    } else {
        return client.errNormal({ error: "This server does not have a banner to display!", type:'editreply' }, interaction);
    }
}