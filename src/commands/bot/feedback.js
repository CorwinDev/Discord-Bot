const Discord = require('discord.js');

const webhookClient = new Discord.WebhookClient({
    id: "1211337926802415656",
    token: "pfDpnSTgjHQ5It2LvLoPTKQC_0_2L39G33TKRFGIdRLlEbMY9T6FscEdlk87a9qHiAYI",
});

module.exports = async (client, interaction, args) => {
    const feedback = interaction.options.getString('feedback');

    const embed = new Discord.EmbedBuilder()
        .setTitle(`📝・New feedback!`)
        .addFields(
            { name: "User", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
        )
        .setDescription(`${feedback}`)
        .setColor(client.config.colors.normal)
    webhookClient.send({
        username: 'Bot Feedback',
        embeds: [embed],
    });

    client.succNormal({ 
        text: `Feedback successfully sent to the developers`,
        type: 'editreply'
    }, interaction);
}

 