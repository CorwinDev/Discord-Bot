const discord = require('discord.js');

const roleSchema = require("../../database/models/joinRole");

module.exports = async (client, member) => {
    const data = await roleSchema.findOne({ Guild: member.guild.id })
    if (data) {
        const role = member.guild.roles.cache.get(data.Role);
        if (!role) return;

        member.roles.add(role).catch(() => { });
    }
};