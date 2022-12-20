const Discord = require('discord.js');
const { Canvas } = require("canvacord");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' });

    const lvl = 4

    const img = await Canvas.blur(userAvatar, lvl)

    let attach = new Discord.AttachmentBuilder(img, { name: "blurred.png" });
    interaction.editReply({ files: [attach] })
}

