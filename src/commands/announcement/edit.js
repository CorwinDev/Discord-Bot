const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const message = interaction.options.getString('message');
    const messageId = interaction.options.getString('id');

    const editMessage = await interaction.channel.messages.fetch(messageId);

    client.embed({ 
        title: `📢・Announcement!`, 
        desc: message,
        type: 'edit'
    }, editMessage);

    client.succNormal({
        text: `Announcement has been edit successfully!`,
        type: 'ephemeraledit'
    }, interaction);
}

 