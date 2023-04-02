const Discord = require('discord.js');

const Schema = require('../../database/models/userBans');

const webhookClientLogs = new Discord.WebhookClient({
  id: "",
  token: "",
});

module.exports = async (client, interaction, args) => {
    const boolean = interaction.options.getBoolean('new');
    const member = interaction.options.getUser('user');
  
    if (boolean == true) {
        if (member.id === interaction.user.id) { // add the check here
            return client.errNormal({
                error: `Vous ne pouvez pas vous interdiction du bot`,
                type: `editreply`
            }, interaction);
        }

        Schema.findOne({ User: member.id }, async (err, data) => {
            if (data) {
                return client.errNormal({
                    error: `<@!${member.id}> (${member.id}) a déjà été banni du bot`,
                    type: `editreply`
                }, interaction);
            }
            else {
                new Schema({
                    User: member.id
                }).save();

                client.succNormal({
                    text: `<@!${member.id}> (${member.id}) Interdiction du bot`,
                    type: 'editreply'
                }, interaction)

                let embedLogs = new Discord.EmbedBuilder()
                    .setTitle(`🔨・Interdire ajoutée`)
                    .setDescription(`<@!${member.id}> (${member.id}) Interdiction du bot`)
                    .addFields(
                        { name: "👤┆Interdit par", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                    )
                    .setColor(client.config.colors.normal)
                    .setFooter({ text: client.config.discord.footer })
                    .setTimestamp();
                webhookClientLogs.send({
                    username: 'Interdictions de bot',
                    embeds: [embedLogs],
                });
            }
        })
    }
    else if (boolean == false) {
        Schema.findOne({ User: member.id }, async (err, data) => {
            if (data) {
                Schema.findOneAndDelete({ User: member.id }).then(() => {
                    client.succNormal({
                        text: `<@!${member.id}> (${member.id}) UNCANNÉ DU BOT`,
                        type: 'editreply'
                    }, interaction)

                    let embedLogs = new Discord.EmbedBuilder()
                        .setTitle(`🔨・Interdire supprimée`)
                        .setDescription(`<@!${member.id}> (${member.id}) UNCANNÉ DU BOT`)
                        .addFields(
                            { name: "👤┆Infassé par", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                        )
                        .setColor(client.config.colors.normal)
                        .setFooter({ text: client.config.discord.footer })
                        .setTimestamp();
                    webhookClientLogs.send({
                        username: 'Interdictions de bot',
                        embeds: [embedLogs],
                    });
                })
            }
            else {
                return client.errNormal({
                    error: `<@!${member.id}> (${member.id}) has not been banned from the bot`,
                    type: `editreply`
                }, interaction);
            }
        })
    }
}

