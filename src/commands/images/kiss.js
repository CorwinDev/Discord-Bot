const Discord = require('discord.js');
const DIG = require("discord-image-generation");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    let avatar = interaction.user.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' });
    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' });
    const image = await new DIG.Kiss().getImage(avatar, userAvatar);
    let attach = new Discord.AttachmentBuilder(image, { name: "kiss.png" });

    interaction.editReply({ files: [attach] })
}

