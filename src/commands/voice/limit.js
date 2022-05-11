const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const perms = await client.checkBotPerms({
        flags: [Discord.Permissions.FLAGS.MANAGE_CHANNELS],
        perms: ["MANAGE_CHANNELS"]
    }, interaction)

    if (perms == false) return;

    let limit = interaction.options.getNumber('limit');

    const channel = interaction.member.voice.channel;
    if (!channel) return client.errNormal({
        error: `You're not in a voice channel!`,
        type: 'editreply'
    }, interaction);

    if (!client.checkVoice(interaction.guild, channel)) return client.errNormal({
        error: `You cannot edit this channel!`,
        type: 'editreply'
    }, interaction);

    channel.setUserLimit(limit);

    client.succNormal({
        text: `The channel limit was to \`${limit}\`!`,
        fields: [
            {
                name: `📘┆Channel`,
                value: `${channel} (${channel.name})`
            }
        ],
        type: 'editreply'
    }, interaction);

}

 