const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {


    const guild = await client.guilds.fetch('355051708503687168')
    const members = await guild.members.fetch()  

    for  
    let name = encodeURIComponent(interaction.options.getString('name'));
    let link = 'https://www.bing.com/search?q=${name}';

    client.succNormal({
        text: 'I have found the following for: \'${name}\'',
        fields: [
            {
                name: '🔗┇Link',
                value: '[Click here to see the link](${link})',
                inline: true,
            }
        ], type: 'editreply'
    }, interaction);

}

 