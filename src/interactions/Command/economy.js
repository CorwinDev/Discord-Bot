const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Play the economy game in your server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the economy category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('additem')
                .setDescription('Add a role item to the economy store')
                .addRoleOption(option => option.setName('role').setDescription('Select a role').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount').setRequired(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addmoney')
                .setDescription('Add money to a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('See your balance')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('beg')
                .setDescription('Beg for money')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('buy')
                .setDescription('Buy items in the Bot store')

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear the economy')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('crime')
                .setDescription('Commit a crime')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('Claim your daily money')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deleteitem')
                .setDescription('Delete a role item from the economy store')
                .addRoleOption(option => option.setName('role').setDescription('Select a role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deposit')
                .setDescription('Deposit money to the bank')
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('fish')
                .setDescription('Fish some fish')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hourly')
                .setDescription('Claim your hourly money')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hunt')
                .setDescription('Hunt some animals')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('monthly')
                .setDescription('Claim your monthly money')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pay')
                .setDescription('Pay a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('present')
                .setDescription('Get a weekly present')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removemoney')
                .setDescription('Remove money from a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rob')
                .setDescription('Rob a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('store')
                .setDescription('Show the store of this guild')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('weekly')
                .setDescription('Claim your weekly money')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('withdraw')
                .setDescription('Withdraw your money')
                .addNumberOption(option => option.setName('amount').setDescription('Enter a amount').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('work')
                .setDescription('Go to work')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('yearly')
                .setDescription('Claim your yearly money')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('See the economy leaderboard')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The leaderboard type that you want')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Money', value: 'money'},
                            {name: 'Bank', value: 'bank'}
                        )
                )
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        client.loadSubcommands(client, interaction, args);
    },
};

 