const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
    mongoose.connect(process.env.MONGO_TOKEN, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    mongoose.connection.once("open", () => {
        console.log(chalk.blue(chalk.bold('Systeme')), (chalk.white('>>')), chalk.red('MongoDB'), chalk.green('est prêt !'))
    });
    return;
}

module.exports = connect