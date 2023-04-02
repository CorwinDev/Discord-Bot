const Discord = require('discord.js');
const Schema = require("../../database/models/music");

module.exports = async (client, interaction, args) => {
    const webhookClientLogs = new Discord.WebhookClient({
        id: client.webhooks.voiceLogs.id,
        token: client.webhooks.voiceLogs.token,
    });

    let channel = interaction.member.voice ? interaction.member.voice.channel : null;
    if (!channel) return client.errNormal({ error: `Le canal n'existe pas!`, type: 'editreply' }, interaction);

    client.radioStop(channel);

    var remove = await Schema.deleteOne({ Guild: interaction.guild.id });

    client.embed({
        title: `📻・La radio s'est arrêtée`,
        desc: `La radio a cessé avec succès \ nPour faire rejoindre le bot: \`rplay\``,
        fields: [{
            name: "👤┆Arreté par",
            value: `${interaction.user} (${interaction.user.tag})`,
            inline: true
        },
        {
            name: "📺┆Canal",
            value: `${channel} (${channel.name})`,
            inline: true
        }
        ],
        type: 'editreply'
    }, interaction)

    let embed = new Discord.EmbedBuilder()
        .setTitle(`📻・La radio s'est arrêtée`)
        .setDescription(`_______________ \n\nLa radio s'est arrêtée avec succès`)
        .addFields(
            { name: "👤┆Arreté par", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
            { name: "📺┆Canal", value: `${channel} (${channel.name})`, inline: true },
            { name: "⚙️┆Serveur", value: `${interaction.guild.name} (${interaction.guild.id})`, inline: true },
        )
        .setColor(client.config.colors.normal)
        .setTimestamp();
    webhookClientLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });
}

 