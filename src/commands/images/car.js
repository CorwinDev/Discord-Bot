const Discord = require('discord.js');
const pop = require("popcat-wrapper");

module.exports = async (client, interaction, args) => {

    const image = await pop.car();
    let attach = new Discord.MessageAttachment(image.image, "car.png");

    interaction.editreply({ files: [attach] })
};