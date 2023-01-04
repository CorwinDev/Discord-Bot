const Discord = require('discord.js');
const DIG = require("discord-image-generation");

module.exports = async (client, interaction, args) => {
    const user = interaction.options.getUser('user') || interaction.user;

    let avatar = interaction.user.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });
    const userAvatar = user.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });
    const image = await new DIG.Spank().getImage(avatar, userAvatar);
    let attach = new Discord.AttachmentBuilder(image, {name: "spank.png"});

    const embed = client.templateEmbed().setImage("attachment://spank.png");
    interaction.editReply({ files: [attach], embeds: [embed] });
}

 