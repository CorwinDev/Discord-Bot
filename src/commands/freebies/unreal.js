const Discord = require('discord.js');
const {getMarketplaceData, generateMessage, sendMessage} = require('../../assets/utils/unrealFreebiesFunctions.js');

module.exports = async (client, interaction, args) => {
    const author = interaction.user;

    try {
        const marketplaceData = await getMarketplaceData();
        var messageData = generateMessage(marketplaceData);
        messageData[0].content = `Hey ${author}, voilà les Freebies Unreal du mois !`;
        //messageData[0].allowedMentions.repliedUser = false;
        await interaction.channel.send(messageData[0])
        await interaction.channel.send(messageData[1])
    } catch (error) {
        console.log("Error sending Unreal Freebies");
        console.log(error);
    }
}

 