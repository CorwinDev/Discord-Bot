const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosetup')
        .setDescription('Laissez la configuration du bot automatiquement')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Obtenez des informations sur les commandes de configuration automatique')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Définissez les journaux du serveur')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('La configuration que vous voulez')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Server logs', value: 'serverLogs' },
                            { name: 'Level logs', value: 'levelLogs' },
                            { name: 'Boost logs', value: 'boostLogs' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('fun')
                .setDescription('Définissez les canaux amusants du serveur')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('La configuration que vous voulez')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthdays', value: 'birthdays' },
                            { name: 'Chatbot', value: 'chatbot' },
                            { name: 'Reviews', value: 'reviews' },
                            { name: 'Suggestions', value: 'suggestions' },
                            { name: 'Starboard', value: 'starboard' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('games')
                .setDescription('Définissez les canaux de jeu du serveur')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('La configuration que vous voulez')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Counting', value: 'counting' },
                            { name: 'Guess the number', value: 'gtn' },
                            { name: 'Guess the word', value: 'gtw' },
                            { name: 'Word snake', value: 'wordsnake' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Configurer le système de bienvenue')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('La configuration que vous voulez')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome channel', value: 'welcomechannel' },
                            { name: 'Welcome role', value: 'welcomerole' },
                            { name: 'Leave channnel', value: 'leavechannel' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('customvoice')
                .setDescription('Définissez les canaux vocaux personnalisés du serveur')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticketpanel')
                .setDescription('Définissez le panneau de ticket du serveur')
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        await interaction.deferReply({ fetchReply: true });
        const perms = await client.checkUserPerms({
            flags: [Discord.PermissionsBitField.Flags.Administrator],
            perms: [Discord.PermissionsBitField.Flags.Administrator]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 