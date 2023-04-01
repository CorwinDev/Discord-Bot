const Discord = require('discord.js');
const pop = require("popcat-wrapper");

module.exports = async (client, interaction, args) => {

    const member = interaction.options.getUser('user');

    const userAvatar = member.displayAvatarURL({ dynamic: false, size: 1024, extension: 'png' });

    const image = await pop.clown(userAvatar);
    let attach = new Discord.AttachmentBuilder(image, { name: "clown.png" });

    const embed = client.templateEmbed().setImage("attachment://clown.png");
    interaction.editReply({ files: [attach], embeds: [embed] });
}

