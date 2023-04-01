const Discord = require('discord.js');

module.exports = async (client, interaction) => {

    const args = interaction.options.getString('text');

    if (args.length > 4096) return client.errNormal({ error: "Your emojify text cannot be longer than 4096 characters", type: 'editreply' }, interaction);

    const specialCodes = {
        '0': ':zero:',
        '1': ':one:',
        '2': ':two:',
        '3': ':three:',
        '4': ':four:',
        '5': ':five:',
        '6': ':six:',
        '7': ':seven:',
        '8': ':eight:',
        '9': ':nine:',
        '#': ':hash:',
        '*': ':asterisk:',
        '?': ':grey_question:',
        '!': ':grey_exclamation:',
        ' ': '   '
    }

    const text = args.toLowerCase().split('').map(letter => {
        if (/[a-z]/g.test(letter)) {
            return `:regional_indicator_${letter}:`
        } else if (specialCodes[letter]) {
            return `${specialCodes[letter]}`
        }
        return letter;
    }).join('');

    client.embed({
        title: `🙂・Emojify`,
        desc: `${text}`,
        type: 'editreply'
    }, interaction)

}

 