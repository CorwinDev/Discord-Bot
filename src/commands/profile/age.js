const Schema = require('../../database/models/profile');

module.exports = async (client, interaction, args) => {

    const age = interaction.options.getNumber('number');

    Schema.findOne({ User: interaction.user.id }, async (err, data) => {
        if (data) {
            if (isNaN(age)) return client.errNormal({ error: "No valid number provided", type: 'editreply' }, interaction)

            data.Age = age;
            data.save();

            client.succNormal({
                text: "Your age is set",
                fields: [{
                    name: "📆┆Age",
                    value: `\`\`\`${age}\`\`\``,
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

 