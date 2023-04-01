const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = (client, node, error) => {
    console.log(chalk.red(chalk.bold(`ERROR`)), (chalk.white(`>>`)), chalk.white(`Node`), chalk.red(`${node.options.identifier}`), chalk.white(`had an error:`), chalk.red(`${error.message}`))
};