const Discord = require('discord.js');
const DIG = require("discord-image-generation");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const avatar = interaction.user.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });
    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });
    const image = await new DIG.Kiss().getImage(avatar, userAvatar);
    let attach = new Discord.AttachmentBuilder(image, { name: "kiss.png" });
    const embed = client.templateEmbed();
    embed.setImage('attachment://kiss.png')
    embed.setDescription(`**${interaction.user.username}** kissed **${member.username}**`)
    interaction.editReply({ files: [attach], embeds: [embed] })
}

