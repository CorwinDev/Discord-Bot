const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
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

    const id1 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    const id2 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    const id3 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    const id4 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    const id5 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    const id6 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    const id7 =
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20) +
        '-' +
        getRandomString(20);

    let score = 0;
    const width = 15;
    const height = 10;
    const gameBoard = [];
    let inGame = false;
    let snakeLength = 1;
    const apple = { x: 0, y: 0 };
    let snake = [{ x: 0, y: 0 }];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            gameBoard[y * width + x] = "⬛";
        }
    }

    function gameBoardToString() {
        let str = '';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x == apple.x && y == apple.y) {
                    str += "🍎";
                    continue;
                }
                let flag = true;
                for (let s = 0; s < snake.length; s++) {
                    if (x == snake[s].x && y == snake[s].y) {
                        str += "🐍";
                        flag = false;
                    }
                }
                if (flag) {
                    str += gameBoard[y * width + x];
                }
            }
            str += '\n';
        }
        return str;
    }

    function isLocInSnake(pos) {
        return snake.find((sPos) => sPos.x == pos.x && sPos.y == pos.y);
    }

    function newappleLoc() {
        let newapplePos = {
            x: 0,
            y: 0,
        };
        do {
            newapplePos = {
                x: parseInt(Math.random() * width),
                y: parseInt(Math.random() * height),
            };
        } while (isLocInSnake(newapplePos));
        apple.x = newapplePos.x;
        apple.y = newapplePos.y;
    }

    function step(msg) {
        if (apple.x == snake[0].x && apple.y == snake[0].y) {
            score += 1;
            snakeLength++;
            newappleLoc();
        }

        lock1 = new Discord.ButtonBuilder()
            .setLabel('\u200b')
            .setStyle(Discord.ButtonStyle.Secondary)
            .setCustomId(id1)
            .setDisabled(true);
        w = new Discord.ButtonBuilder()
            .setEmoji("⬆️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id2);
        lock2 = new Discord.ButtonBuilder()
            .setLabel('\u200b')
            .setStyle(Discord.ButtonStyle.Secondary)
            .setCustomId(id7)
            .setDisabled(true);
        a = new Discord.ButtonBuilder()
            .setEmoji("⬅️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id3);
        s = new Discord.ButtonBuilder()
            .setEmoji("⬇️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id4);
        d = new Discord.ButtonBuilder()
            .setEmoji("➡️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id5);
        stopy = new Discord.ButtonBuilder()
            .setLabel("Cancel")
            .setStyle(Discord.ButtonStyle.Danger)
            .setCustomId(id6);


        client.embed({
            title: `🐍・Snake`,
            desc: gameBoardToString(),
            components: [
                {
                    type: 1,
                    components: [lock1, w, lock2, stopy],
                },
                {
                    type: 1,
                    components: [a, s, d],
                },
            ],
            type: 'editreply'
        }, interaction)
    }

    function gameOver(msg) {
        if (apple.x == snake[0].x && apple.y == snake[0].y) {
            score += 1;
            snakeLength++;
            newappleLoc();
        }

        lock1 = new Discord.ButtonBuilder()
            .setLabel('\u200b')
            .setStyle(Discord.ButtonStyle.Secondary)
            .setCustomId(id1)
            .setDisabled(true);
        w = new Discord.ButtonBuilder()
            .setEmoji("⬆️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id2)
            .setDisabled(true);
        lock2 = new Discord.ButtonBuilder()
            .setLabel('\u200b')
            .setStyle(Discord.ButtonStyle.Secondary)
            .setCustomId(id7)
            .setDisabled(true);
        a = new Discord.ButtonBuilder()
            .setEmoji("⬅️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id3)
            .setDisabled(true);
        s = new Discord.ButtonBuilder()
            .setEmoji("⬇️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id4)
            .setDisabled(true);
        d = new Discord.ButtonBuilder()
            .setEmoji("➡️")
            .setStyle(Discord.ButtonStyle.Primary)
            .setCustomId(id5)
            .setDisabled(true);
        stopy = new Discord.ButtonBuilder()
            .setLabel("Cancel")
            .setStyle(Discord.ButtonStyle.Danger)
            .setCustomId(id6)
            .setDisabled(true);

        client.embed({
            title: `🐍・Snake`,
            desc: `GG, you scored **${score}** points!`,
            components: [
                {
                    type: 1,
                    components: [lock1, w, lock2, stopy],
                },
                {
                    type: 1,
                    components: [a, s, d],
                },
            ],
            type: 'editreply'
        }, interaction)
    }

    if (inGame) return;
    inGame = true;
    score = 0;
    snakeLength = 1;
    snake = [{ x: 5, y: 5 }];
    newappleLoc();

    lock1 = new Discord.ButtonBuilder()
        .setLabel('\u200b')
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId(id1)
        .setDisabled(true);
    w = new Discord.ButtonBuilder()
        .setEmoji("⬆️")
        .setStyle(Discord.ButtonStyle.Primary)
        .setCustomId(id2);
    lock2 = new Discord.ButtonBuilder()
        .setLabel('\u200b')
        .setStyle(Discord.ButtonStyle.Secondary)
        .setCustomId(id7)
        .setDisabled(true);
    a = new Discord.ButtonBuilder()
        .setEmoji("⬅️")
        .setStyle(Discord.ButtonStyle.Primary)
        .setCustomId(id3);
    s = new Discord.ButtonBuilder()
        .setEmoji("⬇️")
        .setStyle(Discord.ButtonStyle.Primary)
        .setCustomId(id4);
    d = new Discord.ButtonBuilder()
        .setEmoji("➡️")
        .setStyle(Discord.ButtonStyle.Primary)
        .setCustomId(id5);
    stopy = new Discord.ButtonBuilder()
        .setLabel("Cancel")
        .setStyle(Discord.ButtonStyle.Danger)
        .setCustomId(id6);

    client.embed({
        title: `🐍・Snake`,
        desc: gameBoardToString(),
        components: [
            {
                type: 1,
                components: [lock1, w, lock2, stopy],
            },
            {
                type: 1,
                components: [a, s, d],
            },
        ],
        type: 'editreply'
    }, interaction).then(async (m) => {
        const collector = interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button });

        collector.on('collect', async (btn) => {
            if (btn.user.id !== interaction.user.id) return;

            btn.deferUpdate();

            const snakeHead = snake[0];
            const nextPos = {
                x: snakeHead.x,
                y: snakeHead.y,
            };
            if (btn.customId === id3) {
                let nextX = snakeHead.x - 1;
                if (nextX < 0) {
                    nextX = width - 1;
                }
                nextPos.x = nextX;
            } else if (btn.customId === id2) {
                let nextY = snakeHead.y - 1;
                if (nextY < 0) {
                    nextY = height - 1;
                }
                nextPos.y = nextY;
            } else if (btn.customId === id4) {
                let nextY = snakeHead.y + 1;
                if (nextY >= height) {
                    nextY = 0;
                }
                nextPos.y = nextY;
            } else if (btn.customId === id5) {
                let nextX = snakeHead.x + 1;
                if (nextX >= width) {
                    nextX = 0;
                }
                nextPos.x = nextX;
            } else if (btn.customId === id6) {
                gameOver(m);
                collector.stop();
            }

            if (isLocInSnake(nextPos)) {
                gameOver(m);
                collector.stop();
            } else {
                snake.unshift(nextPos);
                if (snake.length > snakeLength) {
                    snake.pop();
                }
                step(m);
            }
        });
    })
}

 