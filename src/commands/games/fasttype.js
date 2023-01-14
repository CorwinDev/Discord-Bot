const Discord = require('discord.js');
const ms = require('ms');

let timeLength = 50000;
module.exports = async (client, interaction, args) => {

    let list = `Because we were lost, we had to go back the way we came.
    He's in a boy band which doesn't make much sense for a snake.
    A dead duck doesn't fly backward.
    Don't piss in my garden and tell me you're trying to help my plants grow.
    Her scream silenced the rowdy teenagers.
    The team members were hard to tell apart since they all wore their hair in a ponytail.
    I hear that Nancy is very pretty.
    Nudist colonies shun fig-leaf couture.
    A song can make or ruin a person’s day if they let it get to them.
    She saw no irony asking me to change but wanting me to accept her for who she is.
    My uncle's favorite pastime was building cars out of noodles.
    In the end, he realized he could see sound and hear words.
    Please look up a recipe for chicken soup on the internet.
    It didn't take long for Gary to detect the robbers were amateurs.
    How did you get hurt?
    It was obvious she was hot, sweaty, and tired.
    He appeared to be confusingly perplexed.
    Love is not like pizza.
    It was always dangerous to drive with him since he insisted the safety cones were a slalom course.
    As he waited for the shower to warm, he noticed that he could hear water change temperature.
    Greetings from the galaxy MACS0647-JD, or what we call home.
    The world has changed a lot during the last ten years.
    As he entered the church he could hear the soft voice of someone whispering into a cell phone.
    Now I need to ponder my existence and ask myself if I'm truly real
    Yesterday's weather was good for climbing.
    Waffles are always better without fire ants and fleas.
    Nancy was proud that she ran a tight shipwreck.
    He was so preoccupied with whether or not he could that he failed to stop to consider if he should.
    If eating three-egg omelets causes weight-gain, budgie eggs are a good substitute.
    I don’t respect anybody who can’t tell the difference between Pepsi and Coke.
    He found the end of the rainbow and was surprised at what he found there.
    He wondered why at 18 he was old enough to go to war, but not old enough to buy cigarettes.
    She lived on Monkey Jungle Road and that seemed to explain all of her strangeness.
    Julie wants a perfect husband.
    Can I get you something to drink?
    Please wait outside of the house.
    His son quipped that power bars were nothing more than adult candy bars.
    My older sister looks like my mom.
    The thick foliage and intertwined vines made the hike nearly impossible.
    A glittering gem is not enough.
    Thirty years later, she still thought it was okay to put the toilet paper roll under rather than over.
    Each person who knows you has a different perception of who you are.
    Go down the stairs carefully.
    Facing his greatest fear, he ate his first marshmallow.
    She cried diamonds.
    Tomorrow will bring something new, so leave today as a memory.
    Erin accidentally created a new universe.
    David subscribes to the "stuff your tent into the bag" strategy over nicely folding it.
    The waitress was not amused when he ordered green eggs and ham.
    All you need to do is pick up the pen and begin.`;

    async function start() {
        const inGame = new Set();
        const filter = m => m.author.id === interaction.user.id;
        if (inGame.has(interaction.user.id)) return;
        inGame.add(interaction.user.id);
        var i;
        for (i = 0; i < 25; i++) {
            const time = Date.now();

            list = list.split("\n");
            let sentenceList = list[Math.floor(Math.random() * list.length)];

            let sentence = '';
            let ogSentence = sentenceList.toLowerCase().replace("    ", "");

            ogSentence.split(' ').forEach(argument => {
                sentence += '`' + argument.split('').join(' ') + '` '
            });

            await client.embed({
                title: `💬・FastType`,
                desc: `Type the below in ${ms(timeLength, { long: true })}! \n${sentence}`,
                type: 'editreply'
            }, interaction)

            try {
                var msg = await interaction.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: timeLength,
                    errors: ['time']
                });
            } catch (ex) {
                client.errNormal({
                    error: "Time\'s up!",
                    type: 'editreply'
                }, interaction)
                inGame.delete(interaction.user.id)
                break;
            }

            if (['cancel', 'end'].includes(msg.first().content.toLowerCase().trim())) {
                msg.first().delete();
                client.succNormal({
                    text: "Ended!",
                    type: 'editreply'
                }, interaction)
                inGame.delete(interaction.user.id)
                break
            } else if (msg.first().content.toLowerCase().trim() === ogSentence.toLowerCase()) {
                msg.first().delete();
                client.succNormal({
                    text: `You did it in ${ms(Date.now() - time, { long: true })}!`,
                    type: 'editreply'
                }, interaction)
                break;
            } else {
                client.errNormal({
                    error: "Unfortunately you didn't succeed!",
                    type: 'editreply'
                }, interaction)
                inGame.delete(interaction.user.id)
                break;
            }

            if (i === 25) {
                client.succNormal({ text: `You did it!`, type: 'editreply' }, interaction)
                inGame.delete(interaction.user.id)
                break
            }
        }
    }

    start()
}

 