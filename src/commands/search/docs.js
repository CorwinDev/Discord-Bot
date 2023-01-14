const Discord = require('discord.js');
const axios = require('axios');

module.exports = async (client, interaction, args) => {

    let name = interaction.options.getString('name');

    const uri = `https://djsdocs.sorta.moe/v2/embed?src=stable&q=${encodeURIComponent(
        name
    )}`;

    axios.get(uri).then((embed) => {
        const { data } = embed

        if (data && !data.error) {
            interaction.editreply({ embeds: [data] })
        } else {
            client.errNormal({ 
                error: "Could not find that documentation!", 
                type: 'editreply' 
            }, interaction)
        }
    }).catch((err) => {
    })
}

 