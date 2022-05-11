const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    let link = `https://some-random-api.ml/canvas/triggered/?avatar=${interaction.user.avatarURL({ size: 1024, format: 'png' })}`
    const attachment = new Discord.MessageAttachment(link, 'triggered.gif');

    interaction.editreply({ files: [attachment] })
};