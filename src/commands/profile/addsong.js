const Schema = require('../../database/models/profile');

module.exports = async (client, interaction, args) => {

    const song = interaction.options.getString('song');

    Schema.findOne({ User: interaction.user.id }, async (err, data) => {
        if (data) {

            if (data && data.Songs) {
                if (data.Songs.includes(song)) {
                    return client.errNormal({ error: `That song is already exists in your database!`, type: 'editreply' }, interaction);
                }
                data.Songs.push(song);
                data.save();
            }
            else {
                data.Songs = song;
                data.save();
            }
            client.succNormal({
                text: "Added your song",
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

 