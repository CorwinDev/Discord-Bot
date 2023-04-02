const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.StringSelectMenuBuilder()
                .setCustomId('Bot-linkspanel')
                .setPlaceholder('❌┆Rien de sélectionné')
                .addOptions([
                    {
                        label: `Serveur d'assistance`,
                        description: `Rejoignez le serveur Suppport`,
                        emoji: "❓",
                        value: "support-linkspanel",
                    },
                    {
                        label: `Inviter le bot`,
                        description: `Invitez Bot sur votre serveur`,
                        emoji: "📨",
                        value: "invite-linkspanel",
                    },
                    {
                        label: `Serveur communautaire`,
                        description: `Rejoignez le serveur communautaire!`,
                        emoji: "🌍",
                        value: "community-linkspanel",
                    },
                    {
                        label: `Top.gg`,
                        description: `Afficher le lien top.gg`,
                        emoji: "📃",
                        value: "top.gg-linkspanel",
                    },
                ]),
        );

    client.embed({
        title: `🔗・Links`,
        desc: `Get access to all Bot links! Choose the link you need in the menu below`,
        image: "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
        components: [row],
        type: 'editreply'
    }, interaction)
}

 