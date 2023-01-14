const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = (client, node) => {
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Lavalink`), chalk.green(`connected!`))
};