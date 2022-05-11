const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const perms = await client.checkPerms({
        flags: [Discord.Permissions.FLAGS.MANAGE_CHANNELS],
        perms: ["MANAGE_CHANNELS"]
    }, interaction);

    if (perms == false) return;

    interaction.guild.channels.cache.forEach(ch => {
        if (ch.type == "text") {
            ch.permissionOverwrites.edit(interaction.guild.roles.cache.find(x => x.name === '@everyone'), {
                SEND_MESSAGES: false,
            });
        }
    })

    client.succNormal({
        text: "Channels locked successfully",
        type: 'editreply'
    }, interaction);
}

 