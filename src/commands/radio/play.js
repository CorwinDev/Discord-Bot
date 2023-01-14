const Discord = require('discord.js');
const Schema = require("../../database/models/music");

module.exports = async (client, interaction, args) => {
    const webhookClientLogs = new Discord.WebhookClient({
        id: client.webhooks.voiceLogs.id,
        token: client.webhooks.voiceLogs.token,
    });

    let channel = interaction.member.voice ? interaction.member.voice.channel : null;
    if (!channel) return client.errNormal({ text: `The channel does not exist!`, type: 'editreply' }, interaction);

    client.radioStart(channel);

    Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            data.Channel = channel.id;
            data.save();
        }
        else {
            new Schema({
                Guild: interaction.guild.id,
                Channel: channel.id,
            }).save();
        }
    })

    client.embed({
        title: `📻・Started radio`,
        desc: `La Radio a été lancé avec succès.\nPour faire partir le bot : \`rleave\``,
        fields: [{
            name: "👤┆Lancé par",
            value: `${interaction.user} (${interaction.user.tag})`,
            inline: true
        },
        {
            name: "📺┆Canal",
            value: `${channel} (${channel.name})`,
            inline: true
        },
        {
            name: "🎶┆Station de Radio",
            value: `[Radio 538](https://www.538.nl/)`,
            inline: true
        },
        ],
        type: 'editreply'
    }, interaction)

    let embed = new Discord.MessageEmbed()
        .setTitle(`📻・Started radio`)
        .setDescription(`_______________ \n\nLa Radio a été lancé par succès`)
        .addField('👤┆Lancé par', `${interaction.user} (${interaction.user.tag})`, true)
        .addField('📺┆Canal ', `${channel} (${channel.id})`, true)
        .addField('⚙️┆Serveur ', `${interaction.guild.name} (${interaction.guild.id})`, true)
        .setColor(client.config.colors.normal)
        .setTimestamp();
    webhookClientLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    });
}

 
