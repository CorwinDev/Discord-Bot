const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    let link = `https://some-random-api.ml/canvas/glass/?avatar=${interaction.user.avatarURL({ size: 1024, format: 'png' })}`
    const attachment = new Discord.MessageAttachment(link, 'glass.png');

    interaction.editreply({ files: [attachment] })
};