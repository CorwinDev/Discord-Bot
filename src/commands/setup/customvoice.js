const Discord = require('discord.js');
const Voice = require("../../database/models/voice");

module.exports = async (client, interaction, args) => {
    const category = interaction.options.getChannel('category');
    const channel = interaction.options.getChannel('channel');
    const theme = interaction.options.getString('theme');

    // Définir les modèles de noms selon le thème
    const themeSettings = {
        default: {
            channelName: "🔊 Voice {channel count}",
            defaultName: "🔊 Custom Voice"
        },
        ocean: {
            channelName: ["🌊 La Vague", "🐋 L'Océan", "🐬 Le Lagon", "🏊 La Plage", "⛵ Le Port"],
            defaultName: "🌊 Ocean Voice"
        },
        gaming: {
            channelName: ["🎮 Gaming Room", "🎲 Party Room", "🎯 Squad Voice", "🏆 Team Chat", "🎪 Game Hub"],
            defaultName: "🎮 Gaming Voice"
        },
        aprilfools: {
            channelName: [
                "⇢᲼🐟 Le poisson",
                "⇢᲼🐠・Le poisson rouge",
                "⇢᲼🐡・Le poisson-lune",
                "⇢᲼🦈・Le requin",
                "⇢᲼🐙・La pieuvre",
                "⇢᲼🦞・Le homard",
                "⇢᲼🦐・La crevette",
                "⇢᲼🦀・Le crabe",
                "⇢᲼🦑・Le calamar",
                "⇢᲼🐬・Le dauphin",
                "⇢᲼🐳・La baleine"
            ],
            defaultName: "⇢᲼🐟 Le poisson"
        }
    };

    try {
        // Vérifier si une configuration existe déjà
        const existingSetup = await Voice.findOne({ Guild: interaction.guild.id });
        
        if (existingSetup) {
            // Mettre à jour la configuration existante
            existingSetup.Category = category.id;
            existingSetup.Channel = channel.id;
            existingSetup.Theme = theme;
            existingSetup.ChannelName = Array.isArray(themeSettings[theme].channelName) 
                ? themeSettings[theme].channelName.join('||')
                : themeSettings[theme].channelName;
            existingSetup.DefaultName = themeSettings[theme].defaultName;
            await existingSetup.save();
        } else {
            // Créer une nouvelle configuration
            await new Voice({
                Guild: interaction.guild.id,
                Channel: channel.id,
                Category: category.id,
                ChannelName: Array.isArray(themeSettings[theme].channelName) 
                    ? themeSettings[theme].channelName.join('||')
                    : themeSettings[theme].channelName,
                DefaultName: themeSettings[theme].defaultName,
                Theme: theme,
                ChannelCount: 0
            }).save();
        }

        // Déplacer le salon de création dans la catégorie
        await channel.setParent(category.id, { lockPermissions: false });

        // Configurer les permissions du salon de création
        await channel.permissionOverwrites.set([
            {
                id: interaction.guild.id,
                allow: [Discord.PermissionsBitField.Flags.ViewChannel, Discord.PermissionsBitField.Flags.Connect],
                deny: [Discord.PermissionsBitField.Flags.Speak]
            }
        ]);

        // Envoyer un message de confirmation
        client.succNormal({
            text: `Custom voice system has been set up successfully!`,
            fields: [
                {
                    name: `📘┆Category`,
                    value: `${category} (${category.name})`
                },
                {
                    name: `🎤┆Creation Channel`,
                    value: `${channel} (${channel.name})`
                },
                {
                    name: `🎨┆Theme`,
                    value: `${theme}`
                }
            ],
            type: 'editreply'
        }, interaction);

    } catch (error) {
        console.error(error);
        client.errNormal({
            error: `An error occurred while setting up the custom voice system!`,
            type: 'editreply'
        }, interaction);
    }
}