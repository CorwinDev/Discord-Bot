const Discord = require('discord.js');
const Schema = require("../../database/models/customCommandAdvanced");

module.exports = async (client, interaction, args) => {
    const cmdname = interaction.options.getString('command');
    Schema.findOne({ Guild: interaction.guild.id, Name: cmdname.toLowerCase() }, async (err, data) => {
        console.log(data)
        if (data) {
            Schema.findOneAndDelete({ Guild: interaction.guild.id, Name: cmdname.toLowerCase() }).then(async () => {
                var commands = await interaction.guild.commands.fetch()
                var command = await commands.find((cmd => cmd.name == cmdname.toLowerCase()))
                if(!command) return client.errNormal({ error: "Unable to find this command!", type: 'editreply' }, interaction );
                await interaction.guild.commands.delete(command.id);

                client.succNormal({
                    text: `La commande a été supprimée avec succès`,
                    fields: [{
                        name: "🔧┆Commande",
                        value: `\`\`\`${cmdname}\`\`\``,
                        inline: true,
                    }],
                    type: 'editreply'
                }, interaction);
            })
        }
        else {
            client.errNormal({ error: "Impossible de trouver cette commande!", type: 'editreply' }, interaction);
        }
    })

}

 