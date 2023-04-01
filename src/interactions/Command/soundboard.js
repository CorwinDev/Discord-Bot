const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {

    // Meme Images

    data: new SlashCommandBuilder()
        .setName('soundboard')
        .setDescription('Play all the sounds in Bot')

        .addSubcommand((subcommand) =>
            subcommand
                .setName('help')
                .setDescription('Get information about the soundboard category commands')
        )
        
        // Windows Sounds
        .addSubcommandGroup((group) =>
            group
                .setName('windows')
                .setDescription('Play the windows sounds in Bot')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('windowserror')
                        .setDescription('Play the windows error sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('windowsshutdown')
                        .setDescription('Play the windows shutdown sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('windowsstartup')
                        .setDescription('Play the windows startup sound')
                )
        )

        // Earrape Sounds

        .addSubcommandGroup((group) =>
            group
                .setName('earrape')
                .setDescription('Play the earrape sounds in Bot')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('reee')
                        .setDescription('Play the reee sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('defaultdance')
                        .setDescription('Play the defaultdance sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('startup')
                        .setDescription('Play the startup sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('thomas')
                        .setDescription('Play the thomas sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('wegothim')
                        .setDescription('Play the wegothim sound')
                )
        )

        // Song Sounds

        .addSubcommandGroup((group) =>
            group
                .setName('songs')
                .setDescription('Play the song sounds in Bot')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('dancememe')
                        .setDescription('Play the dancememe sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('despacito')
                        .setDescription('Play the despacito sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('elevator')
                        .setDescription('Play the elevator sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('rickastley')
                        .setDescription('Play the rickastley sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('running')
                        .setDescription('Play the running sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('tobecontinued')
                        .setDescription('Play the tobecontinued sound')
                )
        )

        // Discord Sounds

        .addSubcommandGroup((group) =>
            group
                .setName('discord')
                .setDescription('Play the discord sounds in Bot')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('discordcall')
                        .setDescription('Play the discord call sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('discordjoin')
                        .setDescription('Play the discord voice call join sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName('discordleave').setDescription('Play the discord voice call leave sound')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('discordnotification')
                        .setDescription('Play the discord notification sound'),
                )
        )

        // Discord Sounds

        .addSubcommandGroup((group) =>
            group
                .setName('memes')
                .setDescription('Play the meme sounds in Bot')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('fbi')
                        .setDescription('Play the fbi sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('jeff')
                        .setDescription('Play the jeff sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('lambo')
                        .setDescription('Play the lambo sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('missionfailed')
                        .setDescription('Play the missionfailed sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('moaning')
                        .setDescription('Play themoaning sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('nani')
                        .setDescription('Play the nani sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('nyancat')
                        .setDescription('Play the nyancat sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('ohh')
                        .setDescription('Play the ohh sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('rimshot')
                        .setDescription('Play the rimshot sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('roblox')
                        .setDescription('Play the roblox sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('shotdown')
                        .setDescription('Play the shotdown sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('spongebob')
                        .setDescription('Play the spongebob sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('wow')
                        .setDescription('Play the wow sound'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('yeet')
                        .setDescription('Play the yeet sound'),
                )
        ),

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


 