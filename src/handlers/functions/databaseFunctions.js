module.exports = (client) => {
    client.createChannelSetup = async function (Schema, channel, interaction) {
        Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                data.Channel = channel.id;
                data.save();
            }
            else {
                new Schema({
                    Guild: interaction.guild.id,
                    Channel: channel.id
                }).save();
            }
        });

        client.succNormal({
            text: `Channel has been set up successfully!`,
            fields: [
                {
                    name: `📘┆Channel`,
                    value: `${channel} (${channel.id})`
                }
            ],
            type: 'editreply'
        }, interaction);
    }

    client.createRoleSetup = async function (Schema, role, interaction) {
        Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                data.Role = role.id;
                data.save();
            }
            else {
                new Schema({
                    Guild: interaction.guild.id,
                    Role: role.id
                }).save();
            }
        });

        client.succNormal({
            text: `Role has been set up successfully!`,
            fields: [
                {
                    name: `📘┆Role`,
                    value: `${role} (${role.id})`
                }
            ],
            type: 'editreply'
        }, interaction);
    }
}