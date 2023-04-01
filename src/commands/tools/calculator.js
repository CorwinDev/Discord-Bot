const Discord = require('discord.js');
const math = require('mathjs');

module.exports = async (client, interaction, args) => {
    const createButton = (label, disabled, getRandomString) => {
        let style = Discord.ButtonStyle.Secondary;
        if (label === 'AC' || label === 'DC' || label === '⌫') {
            style = Discord.ButtonStyle.Danger;
        } else if (label === '=') {
            style = Discord.ButtonStyle.Success;
        } else if (
            label === '(' ||
            label === ')' ||
            label === '^' ||
            label === '%' ||
            label === '÷' ||
            label === 'x' ||
            label === '-' ||
            label === '+' ||
            label === '.'
        ) {
            style = Discord.ButtonStyle.Primary;
        }
        if (disabled) {
            const btn = new Discord.ButtonBuilder()
                .setLabel(label)
                .setStyle(style)
                .setDisabled();
            if (label === '\u200b') {
                btn.setCustomId(`${getRandomString(10)}`);
            } else {
                btn.setCustomId('cal' + label);
            }
            return btn;
        } else {
            const btn = new Discord.ButtonBuilder().setLabel(label).setStyle(style);
            if (label === '\u200b') {
                btn.setDisabled();
                btn.setCustomId(`${getRandomString(10)}`);
            } else {
                btn.setCustomId('cal' + label);
            }
            return btn;
        }
    };

    const addRow = (btns) => {
        const row = new Discord.ActionRowBuilder();
        for (const btn of btns) {
            row.addComponents(btn);
        }
        return row;
    };

    const getRandomString = (length) => {
        const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += randomChars.charAt(
                Math.floor(Math.random() * randomChars.length),
            );
        }
        return result;
    };

    let str = ' ';
    let stringify = '```\n' + str + '\n```';

    const row = [];
    const rows = [];

    const button = new Array([], [], [], [], []);
    const buttons = new Array([], [], [], [], []);

    const text = [
        '(',
        ')',
        '^',
        '%',
        'AC',
        '7',
        '8',
        '9',
        '÷',
        'DC',
        '4',
        '5',
        '6',
        'x',
        '⌫',
        '1',
        '2',
        '3',
        '-',
        '\u200b',
        '.',
        '0',
        '=',
        '+',
        '\u200b',
    ];

    let cur = 0;
    let current = 0;

    for (let i = 0; i < text.length; i++) {
        if (button[current].length === 5) current++;
        button[current].push(
            createButton(text[i], false, getRandomString),
        );
        if (i === text.length - 1) {
            for (const btn of button) row.push(addRow(btn));
        }
    }

    await client.embed({
        title: `🧮・Calculator`,
        desc: stringify,
        components: row,
        type: 'editreply'
    }, interaction).then(msg => {
        function edit() {
            client.embed({
                title: `🧮・Calculator`,
                desc: stringify,
                components: row,
                type: 'editreply'
            }, interaction)
        }

        function lock() {
            for (let i = 0; i < text.length; i++) {
                if (buttons[cur].length === 5) cur++;
                buttons[cur].push(
                    createButton(text[i], true, getRandomString),
                );
                if (i === text.length - 1) {
                    for (const btn of buttons) rows.push(addRow(btn));
                }
            }

            client.embed({
                title: `🧮・Calculator`,
                desc: stringify,
                components: [rows],
                type: 'editreply'
            }, interaction)
        }

        const calc = interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button });

        calc.on('collect', async (btn) => {
            if (btn.user.id !== interaction.user.id) return;

            btn.deferUpdate();
            if (btn.customId === 'calAC') {
                str += ' ';
                stringify = '```\n' + str + '\n```';
                edit();
            } else if (btn.customId === 'calx') {
                str += '*';
                stringify = '```\n' + str + '\n```';
                edit();
            } else if (btn.customId === 'cal÷') {
                str += '/';
                stringify = '```\n' + str + '\n```';
                edit();
            } else if (btn.customId === 'cal⌫') {
                if (str === ' ' || str === '' || str === null || str === undefined) {
                    return;
                } else {
                    str = str.split('');
                    str.pop();
                    str = str.join('');
                    stringify = '```\n' + str + '\n```';
                    edit();
                }
            } else if (btn.customId === 'cal=') {
                if (str === ' ' || str === '' || str === null || str === undefined) {
                    return;
                } else {
                    try {
                        str += ' = ' + math.evaluate(str);
                        stringify = '```\n' + str + '\n```';
                        edit();
                        str = ' ';
                        stringify = '```\n' + str + '\n```';
                    } catch (e) {
                        str = "The provided equation is invalid!";
                        stringify = '```\n' + str + '\n```';
                        edit();
                        str = ' ';
                        stringify = '```\n' + str + '\n```';
                    }
                }
            } else if (btn.customId === 'calDC') {
                str = "Calculator is disabled!";
                stringify = '```\n' + str + '\n```';
                edit();
                calc.stop();
                lock();
            } else {
                str += btn.customId.replace('cal', '');
                stringify = '```\n' + str + '\n```';
                edit();
            }
        });

        client.embed({
            title: `🧮・Calculator`,
            desc: stringify,
            components: row,
            type: 'editreply'
        }, interaction)
    })

}

 