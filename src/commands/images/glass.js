const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    let link = `https://some-random-api.com/canvas/glass/?avatar=${interaction.user.avatarURL({ size: 1024, extension: 'png' })}`
    const attachment = new Discord.AttachmentBuilder(link, {name:'glass.png'});

    const embed = client.templateEmbed().setImage("attachment://glass.png");
    interaction.editReply({ files: [attachment], embeds: [embed] });
};