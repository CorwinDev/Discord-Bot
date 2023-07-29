const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const store = require("../../database/models/economyStore");

module.exports = async (client, interaction, args) => {

  const perms = await client.checkPerms({
    flags: [Discord.PermissionsBitField.Flags.Administrator],
    perms: [Discord.PermissionsBitField.Flags.Administrator]
  }, interaction)

  if (perms == false) return;


    const row = new Discord.ActionRowBuilder() 
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('eco_go')
                .setEmoji('✅')
                .setStyle(Discord.ButtonStyle.Success),

            new Discord.ButtonBuilder()
                .setCustomId('eco_stop')
                .setEmoji('❌')
                .setStyle(Discord.ButtonStyle.Danger),
        );

    client.embed({
        title: `⏰・Reset economy`,
        desc: `Are you sure you want to reset the economy?`,
        components: [row],
        type: 'editreply',
    }, interaction)

    const filter = i => i.user.id === interaction.user.id;

    interaction.channel.awaitMessageComponent({ filter, componentType: Discord.ComponentType.Button, time: 60000 }).then(async i => {
        if (i.customId == "eco_go") {
            var remove = await Schema.deleteMany({ Guild: interaction.guild.id });
            var remove2 = await Schema2.deleteMany({ Guild: interaction.guild.id });
            var remove3 = await store.deleteMany({ Guild: interaction.guild.id });

            client.succNormal({
                text: `The economy has been successfully reset in this guild!`,
                components: [],
                type: 'editreply'
            }, interaction);
        }

        if (i.customId == "eco_stop") {
            client.errNormal({
                error: `The economy reset has been cancelled!`,
                components: [],
                type: 'editreply'
            }, interaction);
        }
    })
        .catch(() => {
            client.errNormal({
                error: "Time's up! Cancelled the economy reset!",
                type: 'editreply'
            }, interaction);
        });
}

 