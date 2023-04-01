const Discord = require('discord.js');
const { Canvas } = require("canvacord");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });

    const lvl = 4

    const img = await Canvas.burn(userAvatar, lvl);

    let attach = new Discord.AttachmentBuilder(img, { name: "burn.png" });
    const embed = client.templateEmbed().setImage("attachment://burn.png");
    interaction.editReply({ files: [attach], embeds: [embed] });
}

