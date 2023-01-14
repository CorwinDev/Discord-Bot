const Discord = require('discord.js');
const Schema = require("../../database/models/music");

module.exports = async (client, interaction, args) => {
    const webhookClientLogs = new Discord.WebhookClient({
        id: client.webhooks.voiceLogs.id,
        token: client.webhooks.voiceLogs.token,
    });

    let channel = interaction.member.voice ? interaction.member.voice.channel : null;
    if (!channel) return client.errNormal({ error: 'Le canal n'existe pas !', type: 'editreply' }, interaction);

    client.radioStop(channel);

    var remove = await Schema.deleteOne({ Guild: interaction.guild.id });

    client.embed({
        title: '📻・Radio stopped',
        desc: 'Radio a été coupée avec succès\nPour appeler le bot : \'rplay\'',
        fields: [{
            name: "👤┆Arrêté par",
            value: '${interaction.user} (${interaction.user.tag})',
            inline: true
        },
        {
            name: "📺┆Canal",
            value: '${channel} (${channel.name})',
            inline: true
        }
        ],
        type: 'editreply'
    }, interaction)

    let embed = new Discord.MessageEmbed()
        .setTitle('📻・Radio stopped')
        .setDescription('_______________ \n\nRadio has stopped successfully')
        .addField('👤┆Arrêté par', '${interaction.user} (${interaction.user.tag})', true)
        .addField('📺┆Canal', '${channel} (${channel.id})', true)
        .addField('⚙️┆Serveur', '${interaction.guild.name} (${interaction.guild.id})', true)
        .setColor(client.config.colors.normal)
        .setTimestamp();
    webhookClientLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });
}

 
