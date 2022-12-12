const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
    mongoose.set('strictQuery', false);
    try {
        await mongoose.connect(process.env.MONGO_TOKEN, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MongoDB`), chalk.white(`>>`), chalk.red(`Failed to connect to MongoDB!`), chalk.white(`>>`), chalk.red(`Error: ${err}`))
        console.log(chalk.red("Exiting..."))
        process.exit(1)
    }


    mongoose.connection.once("open", () => {
        console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`is ready!`))
    });
    return;
}

module.exports = connect