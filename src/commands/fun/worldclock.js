
module.exports = async (client, interaction, args) => {
    var gmt = new Date().toLocaleString("en-US", {
        timeZone: "Europe/London",
    });
    var est = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
    });
    var pst = new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
    });
    var cst = new Date().toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
    });
    var aest = new Date().toLocaleString("en-US", {
        timeZone: "Australia/Sydney",
    });
    var awst = new Date().toLocaleString("en-US", {
        timeZone: "Australia/Perth",
    });
    var kst = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
    var ist = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Calcutta",
    });

    client.embed({
        title: `⏰・World clock`,
        fields: [
            {
                name: ":flag_eu:┇London (GMT)",
                value: `${gmt}\n(GMT+0/GMT+1)`,
                inline: true,
            },
            {
                name: ":flag_us:┇New York (EST)",
                value: `${est}\n(GMT-5)`,
                inline: true,
            },
            {
                name: ":flag_us:┇Los Angles (PST)",
                value: `${pst}\n(GMT-8)`,
                inline: true,
            },
            {
                name: ":flag_us:┇Mexico City (CST)",
                value: `${cst}\n(GMT-7)`,
                inline: true,
            },
            {
                name: ":flag_au:┇Sydney (AEST)",
                value: `${aest}\n(GMT+11)`,
                inline: true,
            },
            {
                name: ":flag_au:┇Perth (AWST)",
                value: `${awst}\n(GMT+8)`,
                inline: true,
            },
            {
                name: ":flag_kr:┇Korean (KST)",
                value: `${kst}\n(GMT+9)`,
                inline: true,
            },
            {
                name: ":flag_in:┇India (IST)",
                value: `${ist}\n(GMT+05:30)`,
                inline: true,
            },
            {
                name: "\u200b",
                value: `\u200b`,
                inline: true,
            },
        ],
        type: 'editreply'
    }, interaction)
}

 