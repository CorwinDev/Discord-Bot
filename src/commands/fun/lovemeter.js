
module.exports = async (client, interaction, args) => {

    const user1 = interaction.options.getUser('user1');
    const user2 = interaction.options.getUser('user2');

    if (!user1 || !user2) return client.errUsage({ usage: "lovemeter [user1]", type: 'editreply' }, interaction);

    if (user1 == user2) return client.errNormal({ error: "You cannot give 2 of the same names!", type: 'editreply' }, interaction);

    var result = Math.ceil(Math.random() * 100);

    client.embed({
        title: `${client.emotes.normal.heart}・Love meter`,
        desc: "See how much you match!",
        fields: [
            {
                name: "Name 1",
                value: `${user1}`,
                inline: true,
            },
            {
                name: "Name 2",
                value: `${user2}`,
                inline: true,
            },
            {
                name: "Result",
                value: `**${user2}** and **${user2}** match **${result}%**`,
                inline: false,
            },
        ],
        type: 'editreply'
    }, interaction)
}

     