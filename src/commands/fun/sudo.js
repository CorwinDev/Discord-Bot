const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    const user = interaction.options.getUser('user');
    const text = interaction.options.getString('text');

    if (text.length >= 2000) return client.errNormal({ error: "You may not use more than 2000 characters!", type: 'editreply' }, interaction);

    interaction.channel.createWebhook({
        name: user.username,
        avatar: user.displayAvatarURL(),
    }).then(async (_webhook) => {
        await _webhook.send(client.removeMentions(text));
        _webhook.delete();

        client.succNormal({
            text: `The sudo message was sent!`, 
            type: 'ephemeraledit' 
        }, interaction);
    });
}

 