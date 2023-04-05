const Discord = require('discord.js');

const Schema = require("../../database/models/triggers");

module.exports = async (client, interaction, args) => {
    var data = await Schema.find({ Guild: interaction.guild.id });
    if (data.length === 0) return client.errNormal({ 
        error: `Aucune donnée disponible!`,
        type: 'editreply'
    }, interaction);
    data = data[0].Triggers;
    let list = ``;
    var typeString = ["blank","Répond","Répond puis supprime","Supprime","Ajoute une réaction"];

    for (var i = 0; i < data.length; i++) {
        list += `--------------------- \n
        **${i + 1} - ${data[i].alias}** \n
        Type : ${typeString[data[i].type]} \n
        Regex : \`${data[i].regex}\` \n
        RegexFlags \`${data[i].regexFlags}\` \n
        Réponse : \`${data[i].response}\` \n
        Emotes : \`${data[i].emotes}\` \n
        Mention : \`${data[i].mention}\` Message suivi : \`${data[i].replied}\`
        \n`;
    }

    await client.embed({
        title: "📃・Liste des triggers",
        desc: list,
        type: 'editreply'
    }, interaction)
}