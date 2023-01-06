const Discord = require("discord.js");

module.exports = async (client) => {
    const guildInvites = new Map();

    client.on(Discord.Events.InviteCreate, async invite => {
        try {
            const invites = await invite.guild.invites.fetch().catch(() => { });

            const codeUses = new Map();
            await invites.each(inv => codeUses.set(inv.code, inv.uses));

            await guildInvites.set(invite.guild.id, codeUses);
        }
        catch { }
    })

    client.once(Discord.Events.ClientReady, async () => {
        setTimeout(() => {
            try {
                client.guilds.cache.forEach(async (guild) => {
                    if (!guild || !guild.invites) return;

                    guild.invites.fetch().then(rawGuildInvites => {
                        const codeUses = new Map();
                        Array.from(rawGuildInvites).forEach(i => {
                            codeUses.set(i[1].code, i[1].uses);
                        })
                        guildInvites.set(guild.id, codeUses);
                    }).catch(() => { console.log });
                });
            } catch (e) { }
        }, 1000);
    });

    client.on(Discord.Events.GuildCreate, async guild => {
        try {
            if (!guild || !guild.invites) return;

            guild.invites.fetch().then(rawGuildInvites => {
                const codeUses = new Map();
                Array.from(rawGuildInvites).forEach(i => {
                    codeUses.set(i[1].code, i[1].uses);
                })
                guildInvites.set(guild.id, codeUses);
            }).catch(() => { });
        } catch (e) { }
    });

    client.on(Discord.Events.GuildDelete, async guild => {
        try {
            guildInvites.delete(guild.id);
        } catch (e) { }
    });

    client.on(Discord.Events.GuildMemberAdd, async member => {
        try {
            const cachedInvites = await guildInvites.get(member.guild.id)
            const newInvites = await member.guild.invites.fetch().catch(() => { console.log });

            const codeUses = new Map();
            Array.from(newInvites).forEach(async i => {
                codeUses.set(i[1].code, i[1].uses);
            })
            guildInvites.set(member.guild.id, codeUses);

            const usedInvite = await newInvites.find(inv => cachedInvites.get(inv.code) < inv.uses);
            if (!usedInvite) return client.emit("inviteJoin", member, null, null);

            client.emit("inviteJoin", member, usedInvite, usedInvite.inviter);
        } catch (err) {
            return client.emit("inviteJoin", member, null, null);
        }
    });
}