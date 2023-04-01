const Schema = require('../../database/models/profile');

module.exports = async (client, interaction, args) => {

    const artist = interaction.options.getString('artist');

    Schema.findOne({ User: interaction.user.id }, async (err, data) => {
        if (data) {

            if (data && data.Artists) {
                if (data.Artists.includes(artist)) {
                    return client.errNormal({ error: `That artist is already exists in your database!`, type: 'editreply' }, interaction);
                }
                data.Artists.push(artist);
                data.save();
            }
            else {
                data.Artists = artist;
                data.save();
            }
            client.succNormal({
                text: "Added your artist",
                fields: [{
                    name: "🎤┆Artist",
                    value: `\`\`\`${artist}\`\`\``,
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

 