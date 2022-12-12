const Discord = require('discord.js');
const { Canvas } = require("canvacord");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' });

    const amount = 60

    const image = await Canvas.darkness(userAvatar, amount);
    let attach = new Discord.AttachmentBuilder(image, { name: "blurred.gif" });

    interaction.editReply({ files: [attach] })
}

