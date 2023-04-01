const Discord = require("discord.js");

module.exports = async (client) => {
    const guildInvites = new Map();

    client.on('inviteCreate', async invite => {
        try {
            const invites = await invite.guild.invites.fetch().catch(() => { });

            const codeUses = new Map();
            invites.each(inv => codeUses.set(inv.code, inv.uses));

            guildInvites.set(invite.guild.id, codeUses);
        }
        catch { }
    })

    client.once('ready', async () => {
        try {
            const Guilds = client.guilds.cache.map(guild => guild.id);
            let i = 0;
            let interval = setInterval(async function () {
                const guild = await client.guilds.fetch(Guilds[i]).catch(() => { });
                if (!guild || !guild.invites) return i++;

                guild.invites.fetch().then(rawGuildInvites => {
                    const codeUses = new Map();
                    Array.from(rawGuildInvites).forEach(i => {
                        codeUses.set(i[1].code, i[1].uses);
                    })
                    guildInvites.set(guild.id, codeUses);
                }).catch(() => { });
                i++;

                if (i === Guilds.size) clearInterval(interval);
            }, 1500);
        } catch (e) { }
    });

    client.on('guildMemberAdd', async member => {
        try {
            const cachedInvites = guildInvites.get(member.guild.id)
            const newInvites = await member.guild.invites.fetch().catch(() => { });
            guildInvites.set(member.guild.id, newInvites)

            const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses)
            if (!usedInvite) return client.emit("inviteJoin", member, null, null);

            client.emit("inviteJoin", member, usedInvite, usedInvite.inviter);
        } catch (err) {
            return client.emit("inviteJoin", member, null, null);
        }
    });
}