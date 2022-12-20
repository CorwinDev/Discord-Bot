const Discord = require('discord.js');
const { Canvas } = require("canvacord");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' });

    const image = await Canvas.colorfy(userAvatar, "#ff0000")
    let attach = new Discord.AttachmentBuilder(image, { name: "colorify.png" });

    interaction.editReply({ files: [attach] })
}

