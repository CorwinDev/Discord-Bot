const Discord = require('discord.js');
const { Canvas } = require("canvacord");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' });

    const img = await Canvas.bed(interaction.user.avatarURL({ size: 1024, format: 'png' }), userAvatar);

    let attach = new Discord.AttachmentBuilder(img, { name: "bed.png" });
    interaction.editReply({ files: [attach] })
}

