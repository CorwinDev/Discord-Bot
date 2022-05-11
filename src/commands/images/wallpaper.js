const hdqwalls = require("hdqwalls-wrapper");

module.exports = async (client, interaction, args) => {

    const query = interaction.options.getString('name');

    const image = await hdqwalls(query);

    client.embed({
        title: `🖼・Your wallpaper`,
        image: image[0],
        type: 'editreply'
    }, interaction)
}

 