const Discord = require("discord.js");

/**
 * @param {Discord.Client} client
 * @param {Discord.GuildMember} oldMember
 * @param {Discord.GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
    if (!oldMember || !newMember) return;

    if (oldMember.partial) return;

    // Find actual role changes
    const removedRoles = oldMember.roles.cache.filter(
        (role) => !newMember.roles.cache.has(role.id),
    );

    const addedRoles = newMember.roles.cache.filter(
        (role) => !oldMember.roles.cache.has(role.id),
    );

    // Nothing actually changed
    if (removedRoles.size === 0 && addedRoles.size === 0) return;

    const logsChannel = await client.getLogs(newMember.guild.id);
    if (!logsChannel) return;

    const oldRoles = removedRoles.size
        ? removedRoles.map((role) => `<@&${role.id}>`).join(" ")
        : "No roles removed";

    const newRoles = addedRoles.size
        ? addedRoles.map((role) => `<@&${role.id}>`).join(" ")
        : "No roles added";

    await client.embed(
        {
            title: `${newMember.user.username} roles adjusted`,
            desc: `Roles were changed for <@${newMember.id}>`,
            fields: [
                {
                    name: "> Removed Roles",
                    value: oldRoles,
                },
                {
                    name: "> Added Roles",
                    value: newRoles,
                },
            ],
        },
        logsChannel,
    );
};
