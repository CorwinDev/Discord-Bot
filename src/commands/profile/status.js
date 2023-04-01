const Schema = require('../../database/models/profile');

module.exports = async (client, interaction, args) => {

    const status = interaction.options.getString('text');

    if (status.length > 30) return client.errNormal({ error: "Your status cannot be longer than 30 characters", type: 'editreply' }, interaction);

    Schema.findOne({ User: interaction.user.id }, async (err, data) => {
        if (data) {
            data.Status = status;
            data.save();

            client.succNormal({
                text: "Your status is set",
                fields: [{
                    name: "😎┆Status",
                    value: `\`\`\`${status}\`\`\``,
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

 