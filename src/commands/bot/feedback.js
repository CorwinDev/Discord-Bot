const Discord = require('discord.js');

const webhookClient = new Discord.WebhookClient({
    id: "831574783324848188",
    token: "UMFd7fPeeV7sHewjglLuAyM1819qA6AG8_-8VcIcA-bveVODYXy9Hko3pe0sWWgz9oDa",
});

module.exports = async (client, interaction, args) => {
    const feedback = interaction.options.getString('feedback');

    const embed = new Discord.EmbedBuilder()
        .setTitle(`📝・Nouveaux commentaires!`)
        .addFields(
            { name: "User", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
        )
        .setDescription(`${feedback}`)
        .setColor(client.config.colors.normal)
    webhookClient.send({
        username: 'Rétroaction des robots',
        embeds: [embed],
    });

    client.succNormal({ 
        text: `Les commentaires ont été envoyés avec succès aux développeurs`,
        type: 'editreply'
    }, interaction);
}

 