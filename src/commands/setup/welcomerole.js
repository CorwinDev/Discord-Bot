const Discord = require('discord.js');

const welcomeRole = require("../../database/models/joinRole");

module.exports = async (client, interaction, args) => {
    const role = interaction.options.getRole('role');

    client.createRoleSetup(welcomeRole, role, interaction)
}

 