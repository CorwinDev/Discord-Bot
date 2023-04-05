const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
    mongoose.set('strictQuery', false);
    try {
        console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`se connecte ...`))
        await mongoose.connect(process.env.MONGO_TOKEN, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.log(chalk.red(`[ERREUR]`), chalk.white(`>>`), chalk.red(`MongoDB`), chalk.white(`>>`), chalk.red(`N'a pas réussi à se connecter à MongoDB!`), chalk.white(`>>`), chalk.red(`Erreur: ${err}`))
        console.log(chalk.red("Sort ..."))
        process.exit(1)
    }


    mongoose.connection.once("open", () => {
        console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`est prête!`))
    });

    mongoose.connection.on("error", (err) => {
        console.log(chalk.red(`[ERREUR]`), chalk.white(`>>`), chalk.red(`Database`), chalk.white(`>>`), chalk.red(`N'a pas réussi à se connecter à MongoDB!`), chalk.white(`>>`), chalk.red(`Erreur: ${err}`))
        console.log(chalk.red("Sort ..."))
        process.exit(1)
    });
    return;
}

module.exports = connect