const Discord = require('discord.js');

const Schema = require('../../database/models/votecredits');

const webhookClientLogs = new Discord.WebhookClient({
    id: "",
    token: "",
});

module.exports = async (client, interaction, args) => {
    const type = interaction.options.getString('type');
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getNumber('amount');

    if (type == "add") {
        Schema.findOne({ User: user.id }, async (err, data) => {
            if (data) {
                data.Credits += amount;
                data.save();
            }
            else {
                new Schema({
                    User: user.id,
                    Credits: amount
                }).save();
            }
        })

        client.succNormal({
            text: `Ajoutée **${amount} crédits ** à ${user}`,
            type: 'editreply'
        }, interaction);

        let embedLogs = new Discord.EmbedBuilder()
            .setTitle(`🪙・Crédits ajoutés`)
            .setDescription(`Ajout de crédits à ${user} (${user.id})`)
            .addFields(
                { name: "👤┆Ajouté par", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                { name: "🔢┆Montant", value: `${amount}`, inline: true },
            )
            .setColor(client.config.colors.normal)
            .setTimestamp();
        webhookClientLogs.send({
            username: 'Crédits de bot',
            embeds: [embedLogs],
        });
    }
    else if (type == "remove") {
        Schema.findOne({ User: user.id }, async (err, data) => {
            if (data) {
                data.Credits -= amount;
                data.save();
            }
        })

        client.succNormal({
            text: `Supprimé **${amount} crédits ** de ${user}`,
            type: 'editreply'
        }, interaction);

        let embedLogs = new Discord.EmbedBuilder()
            .setTitle(`🪙・Crédits supprimés`)
            .setDescription(`Supprimé les crédits de ${user} (${user.id})`)
            .addFields(
                { name: "👤┆Supprimé par", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                { name: "🔢┆Montant", value: `${amount}`, inline: true },
            )
            .setColor(client.config.colors.normal)
            .setTimestamp();
        webhookClientLogs.send({
            username: 'Crédits de bot',
            embeds: [embedLogs],
        });
    }
}

 