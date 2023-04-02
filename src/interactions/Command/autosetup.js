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
                            { name: 'Journaux des serveurs', value: 'serverLogs' },
                            { name: 'Journaux de niveau', value: 'levelLogs' },
                            { name: 'Boost les journaux', value: 'boostLogs' }
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
                            { name: 'Anniversaires', value: 'birthdays' },
                            { name: 'chatbot', value: 'chatbot' },
                            { name: 'Commentaires', value: 'reviews' },
                            { name: 'suggestions', value: 'suggestions' },
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
                            { name: 'Compte', value: 'counting' },
                            { name: 'Devinez le nombre', value: 'gtn' },
                            { name: 'Devinez le mot', value: 'gtw' },
                            { name: 'Mot Snake', value: 'wordsnake' }
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
                            { name: 'Canal de bienvenue', value: 'welcomechannel' },
                            { name: 'Rôle de bienvenue', value: 'welcomerole' },
                            { name: 'Quitter le canal', value: 'leavechannel' }
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
        const perms = await client.checkUserPerms({
            flags: [Discord.PermissionsBitField.Flags.Administrator],
            perms: [Discord.PermissionsBitField.Flags.Administrator]
        }, interaction)

        if (perms == false) return;

        client.loadSubcommands(client, interaction, args);
    },
};

 