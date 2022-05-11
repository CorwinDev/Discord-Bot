const Discord = require('discord.js');
const pop = require("popcat-wrapper");

module.exports = async (client, interaction, args) => {

    const splitArgs1 = interaction.options.getString('text1');
    const splitArgs2 = interaction.options.getString('text2');

    const image = await pop.drake(splitArgs1, splitArgs2);
    let attach = new Discord.MessageAttachment(image, "drake.png");

    interaction.editreply({ files: [attach] })
}

 