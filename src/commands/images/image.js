
module.exports = async (client, interaction, args) => {

    const image = interaction.options.getString('image-url');
    const channel = interaction.options.getChannel('channel');

    if (!channel) return client.errNormal({ error: `Channel not found`, type: 'editreply' }, interaction)

    client.succNormal({
        text: `The image was succesfully send to ${channel}`,
        type: 'editreply'
    }, interaction)

    client.simpleEmbed({
        image: `${image}`
    }, channel)
}

 