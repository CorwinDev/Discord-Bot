const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {

    let link = `https://some-random-api.com/canvas/triggered/?avatar=${interaction.user.avatarURL({ size: 1024, extension: 'png' })}`
    const attachment = new Discord.AttachmentBuilder(link, { name: 'triggered.gif' });

    const embed = client.templateEmbed().setImage("attachment://triggered.gif");
    interaction.editReply({ files: [attachment], embeds: [embed] });
};