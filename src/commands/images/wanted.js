const Discord = require('discord.js');
const DIG = require("discord-image-generation");

module.exports = async (client, interaction, args) => {
    const user = interaction.options.getUser('user') || interaction.user;

    let userAvatar = user.displayAvatarURL({ size: 1024, dynamic: false, format: 'png' });
    let img = await new DIG.Wanted().getImage(userAvatar, `€`);
    let attach = new Discord.MessageAttachment(img, "wanted.png");;

    interaction.editreply({ files: [attach] })
}

 