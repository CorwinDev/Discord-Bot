const Discord = require('discord.js');

const Schema = require("../../database/models/economy");

module.exports = async (client, interaction, args) => {
    let user = interaction.user;

    Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
        if (data) {
            let money = parseInt(interaction.options.getNumber('amount'));

            if (!money) return client.errUsage({ usage: "blackjack [amount]", type: 'editreply' }, interaction);
            if (money > data.Money) return client.errNormal({ error: `You are betting more than you have!`, type: 'editreply' }, interaction);

            var numCardsPulled = 0;
            var gameOver = false;
            var player = {
                cards: [],
                score: 0,
            };
            var dealer = {
                cards: [],
                score: 0,
            };
            function getCardsValue(a) {
                var cardArray = [],
                    sum = 0,
                    i = 0,
                    dk = 10.5,
                    doubleking = "QQ",
                    aceCount = 0;
                cardArray = a;
                for (i; i < cardArray.length; i += 1) {
                    if (
                        cardArray[i].rank === "J" ||
                        cardArray[i].rank === "Q" ||
                        cardArray[i].rank === "K"
                    ) {
                        sum += 10;
                    } else if (cardArray[i].rank === "A") {
                        sum += 11;
                        aceCount += 1;
                    } else if (cardArray[i].rank === doubleking) {
                        sum += dk;
                    } else {
                        sum += cardArray[i].rank;
                    }
                }
                while (aceCount > 0 && sum > 21) {
                    sum -= 10;
                    aceCount -= 1;
                }
                return sum;
            }

            var deck = {
                deckArray: [],
                initialize: function () {
                    var suitArray, rankArray, s, r, n;
                    suitArray = ["b", "d", "g", "s"];
                    rankArray = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
                    n = 13;

                    for (s = 0; s < suitArray.length; s += 1) {
                        for (r = 0; r < rankArray.length; r += 1) {
                            this.deckArray[s * n + r] = {
                                rank: rankArray[r],
                                suit: suitArray[s],
                            };
                        }
                    }
                },
                shuffle: function () {
                    var temp, i, rnd;
                    for (i = 0; i < this.deckArray.length; i += 1) {
                        rnd = Math.floor(Math.random() * this.deckArray.length);
                        temp = this.deckArray[i];
                        this.deckArray[i] = this.deckArray[rnd];
                        this.deckArray[rnd] = temp;
                    }
                },
            };
            deck.initialize();
            deck.shuffle();
            async function bet(outcome) {
                if (outcome === "win") {
                    data.Money += money;
                    data.save();
                }
                if (outcome === "lose") {
                    data.Money -= money;
                    data.save();
                }
            }

            function endMsg(f, msg, cl, dealerC) {
                let cardsMsg = "";
                player.cards.forEach(function (card) {
                    var emAR = ["♥", "♦", "♠", "♣"];
                    var t = emAR[Math.floor(Math.random() * emAR.length)];
                    cardsMsg += t + card.rank.toString();
                    if (card.suit == "d1") cardsMsg += "♥";
                    if (card.suit == "d2") cardsMsg += "♦";
                    if (card.suit == "d3") cardsMsg += "♠";
                    if (card.suit == "d4") cardsMsg += "♣";
                    cardsMsg;
                });
                cardsMsg += " > " + player.score.toString();

                var dealerMsg = "";
                if (!dealerC) {
                    var emAR = ["♥", "♦", "♠", "♣"];
                    var t = emAR[Math.floor(Math.random() * emAR.length)];
                    dealerMsg = t + dealer.cards[0].rank.toString();
                    if (dealer.cards[0].suit == "d1") dealerMsg += "♥";
                    if (dealer.cards[0].suit == "d2") dealerMsg += "♦";
                    if (dealer.cards[0].suit == "d3") dealerMsg += "♠";
                    if (dealer.cards[0].suit == "d4") dealerMsg += "♣";
                    dealerMsg;
                } else {
                    dealerMsg = "";
                    dealer.cards.forEach(function (card) {
                        var emAR = ["♥", "♦", "♠", "♣"];
                        var t = emAR[Math.floor(Math.random() * emAR.length)];
                        dealerMsg += t + card.rank.toString();
                        if (card.suit == "d1") dealerMsg += "♥";
                        if (card.suit == "d2") dealerMsg += "♦";
                        if (card.suit == "d3") dealerMsg += "♠";
                        if (card.suit == "d4") dealerMsg += "♣";
                        dealerMsg;
                    });
                    dealerMsg += " > " + dealer.score.toString();
                }

                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('blackjack_hit')
                            .setLabel(`Hit`)
                            .setStyle(Discord.ButtonStyle.Primary),

                        new Discord.ButtonBuilder()
                            .setCustomId('blackjack_stand')
                            .setLabel(`Stand`)
                            .setStyle(Discord.ButtonStyle.Primary),
                    )

                if (cl) {

                    client.embed({
                        title: `♦️・Blackjack`,
                        desc: `${f} \n${msg}`,
                        fields: [
                            {
                                name: `You`,
                                value: cardsMsg,
                                inline: true,
                            },
                            {
                                name: `Bot`,
                                value: dealerMsg,
                                inline: true,
                            }
                        ],
                        type: 'editreply'
                    }, interaction)
                }
                else {
                    client.embed({
                        title: `♦️・Blackjack`,
                        desc: `${f} \n${msg}`,
                        fields: [
                            {
                                name: `You`,
                                value: cardsMsg,
                                inline: true,
                            },
                            {
                                name: `Bot`,
                                value: dealerMsg,
                                inline: true,
                            }
                        ],
                        components: [row],
                        type: 'editreply'
                    }, interaction)
                }
            }

            async function endGame() {
                if (player.score === 21) {
                    bet("win");
                    gameOver = true;
                    endMsg(
                        `Win! You got 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `GREEN`
                    );
                }
                if (player.score > 21) {
                    bet("lose");
                    gameOver = true;
                    endMsg(
                        `Lost! You reached over 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `RED`
                    );
                }
                if (dealer.score === 21) {
                    bet("lose");
                    gameOver = true;
                    endMsg(
                        `Lost! The dealer got 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `RED`
                    );
                }
                if (dealer.score > 21) {
                    bet("win");
                    gameOver = true;
                    endMsg(
                        `Win! Bot reached over 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `GREEN`
                    );
                }
                if (
                    dealer.score >= 17 &&
                    player.score > dealer.score &&
                    player.score < 21
                ) {
                    bet("win");
                    gameOver = true;
                    endMsg(
                        `Win! You defeated Bot!`,
                        `Bot had ${dealer.score.toString()}`,
                        `GREEN`
                    );
                }
                if (
                    dealer.score >= 17 &&
                    player.score < dealer.score &&
                    dealer.score < 21
                ) {
                    bet("lose");
                    gameOver = true;
                    endMsg(
                        `Lost! Bot won!`,
                        `Bot had ${dealer.score.toString()}`,
                        `RED`
                    );
                }
                if (
                    dealer.score >= 17 &&
                    player.score === dealer.score &&
                    dealer.score < 21
                ) {
                    gameOver = true;
                    endMsg(`Tie!`, `Bot had ${dealer.score.toString()}`, `RED`);
                }
            }

            function dealerDraw() {
                dealer.cards.push(deck.deckArray[numCardsPulled]);
                dealer.score = getCardsValue(dealer.cards);
                numCardsPulled += 1;
            }

            function newGame() {
                hit();
                hit();
                dealerDraw();
                endGame();
            }

            function hit() {
                player.cards.push(deck.deckArray[numCardsPulled]);
                player.score = getCardsValue(player.cards);

                numCardsPulled += 1;
                if (numCardsPulled > 2) {
                    endGame();
                }
            }

            function stand() {
                while (dealer.score < 17) {
                    dealerDraw();
                }
                endGame();
            }
            newGame();
            async function loop() {
                if (gameOver) return;

                endMsg(
                    "To hit type `h`, for stand type `s`",
                    `GoodLuck ;)`,
                    client.color
                );

                const filter = i => i.user.id === interaction.user.id;
                interaction.channel.awaitMessageComponent({ filter, max: 1, time: 1200000, errors: ["time"] })
                    .then(async i => {
                        if (i.customId == "blackjack_hit") {
                            hit();
                            loop();
                            return i.deferUpdate();;
                        } else if (i.customId == "blackjack_stand") {
                            stand();
                            loop();
                            return i.deferUpdate();;
                        }
                    })
                    .catch(_ => {
                        interaction.channel.send("Lost!!");
                        bet("lose");
                        return;
                    });
            }
            await loop();
        }
        else {
            client.errNormal({ error: `You don't have any ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
        }
    })
}