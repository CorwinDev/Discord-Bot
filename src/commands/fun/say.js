const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {    
    const text = interaction.options.getString('text');

    if (text.length >= 2000) return client.errNormal({ 
        error: "You may not use more than 2000 characters!", 
        type: 'editreply' 
    }, interaction);

    await interaction.channel.send({ content: client.removeMentions(text) }).then(() => {
        client.succNormal({
            text: `Message sent successfully`,
            type: 'ephemeraledit'
        }, interaction)
    })
}

 