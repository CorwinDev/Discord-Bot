const Discord = require('discord.js');
const pop = require("popcat-wrapper");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' });

    const image = await pop.greyscale(userAvatar);
    let attach = new Discord.AttachmentBuilder(image, { name: "greyscale.png" });

    interaction.editReply({ files: [attach] })
}

