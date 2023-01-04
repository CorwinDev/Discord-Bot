const Discord = require('discord.js');
const DIG = require("discord-image-generation");

module.exports = async (client, interaction, args) => {
    const user1 = interaction.options.getUser('user1') || interaction.user;
    const user2 = interaction.options.getUser('user2') || interaction.user;
    const user3 = interaction.options.getUser('user3') || interaction.user;

    var user1Avatar = user1.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });
    var user2Avatar = user2.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });
    var user3Avatar = user3.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });

    var img = await new DIG.Podium().getImage(user1Avatar, user2Avatar, user3Avatar, user1.tag, user2.tag, user3.tag);
    var attach = new Discord.AttachmentBuilder(img, { name: "podium.png" });
    const embed = client.templateEmbed().setImage("attachment://podium.png");
    interaction.editReply({ files: [attach], embeds: [embed] });
}

