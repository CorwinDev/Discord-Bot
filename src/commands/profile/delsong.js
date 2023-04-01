const Schema = require('../../database/models/profile');

module.exports = async (client, interaction, args) => {

    const song = interaction.options.getString('song');
    const user = { User: interaction.user.id }

    Schema.findOne({ User: interaction.user.id }, async (err, data) => {
        if (data) {

            if (data && data.Songs) {
                if (!data.Songs.includes(song)) {
                    return client.errNormal({ error: `That song doesn't exist in the database!`, type: 'editreply' }, interaction);
                }

                const filtered = data.Songs.filter((target) => target !== song);

                await Schema.findOneAndUpdate(user, {
                    Songs: filtered
                });
            }
            client.succNormal({
                text: "Removed your song",
                fields: [{
                    name: "🎶┆Song",
                    value: `\`\`\`${song}\`\`\``,
                    inline: true,
                }],
                type: 'editreply'
            }, interaction);
        }
        else {
            return client.errNormal({ error: "No profile found! Open a profile with createprofile", type:'editreply' }, interaction);
        }
    })

}

 