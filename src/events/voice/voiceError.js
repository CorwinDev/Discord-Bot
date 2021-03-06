const Discord = require('discord.js');

module.exports = (client, error) => {
    if (error.message == undefined) {
        console.log(error);
        error.message = "Send to console!";
    }
    const errorlog = new Discord.WebhookClient({
        id: client.webhooks.voiceErrorLogs.id,
        token: client.webhooks.voiceErrorLogs.token,
    });

    let embed = new Discord.MessageEmbed()
        .setTitle(`🚨・Voice error`)
        .addField(`Error`, `\`\`\`${error.message}\`\`\``)
        .addField(`Stack error`, `\`\`\`${error.stack}\`\`\``)
        .setColor(client.config.colors.normal)
    errorlog.send({
        username: `Bot errors`,
        embeds: [embed],

    }).catch(error => { console.log(error) })
};