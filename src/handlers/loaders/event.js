const chalk = require('chalk');
const fs = require('fs');
const Discord = require('discord.js');

module.exports = (client) => {

    if (client.shard.ids[0] === 0) console.log(`\u001b[0m`);
    if (client.shard.ids[0] === 0) console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Loading events`)), (chalk.white(`...`)))
    if (client.shard.ids[0] === 0) console.log(`\u001b[0m`);

    fs.readdirSync('./src/events').forEach(dirs => {
        const events = fs.readdirSync(`./src/events/${dirs}`).filter(files => files.endsWith('.js'));

        if (client.shard.ids[0] === 0) console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`${events.length}`), (chalk.green(`events of`)), chalk.red(`${dirs}`), (chalk.green(`loaded`)));

        for (const file of events) {
            const event = require(`../../events/${dirs}/${file}`);
            const eventName = file.split(".")[0];
            const eventUpperCase = eventName.charAt(0).toUpperCase() + eventName.slice(1);
            if(Discord.Events[eventUpperCase] === undefined){
                client.on(eventName, event.bind(null, client)).setMaxListeners(0);
            }else {
            client.on(Discord.Events[eventUpperCase], event.bind(null, client)).setMaxListeners(0);
            }
        };
    });
}

 