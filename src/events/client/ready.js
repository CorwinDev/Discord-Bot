const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = async (client) => {
  const activities2 = [
        { name: `${client.guilds.cache.size} Servers`, type: 2 }, // LISTENING
        { name: `${client.channels.cache.size} Channels`, type: 0 }, // PLAYING
        { name: `${client.users.cache.size} Users`, type: 3 }, // WATCHING
        { name: `si Eliott fait pas bêtises`, type: 3 },
    ];
const activities = [
        { name: `League of Legends`, type: 0 },
        { name: `vec ta mère`, type: 0 },
        { name: `si aucune rebellion ne se forme`, type: 3 },
        { name: `le crépitement de la friture`, type: 2 },
        { name: `si Eliott fait pas de bêtises`, type: 3 },
        { name: `si ça joue à LoL`, type: 3 },
    ];
    const status = [
        'online',
        'dnd',
        'idle'
    ];
    let i = 0;
    setInterval(() => {
        if(i >= activities.length) i = 0
        client.user.setActivity(activities[i])
        i++;
    }, 5000);
    
    client.user.setStatus(status[0])
  
    client.player.init(client.user.id);    
  console.log(chalk.blue(chalk.bold(`Systeme`)), (chalk.white(`>>`)), chalk.red(`${client.user.username}`), chalk.green(`est prêt !`))
}

 
