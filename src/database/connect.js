/*const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
    mongoose.connect(process.env.MONGO_TOKEN, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    return new Promise((resolve, reject) => {
        const collection = mongoose.connection.db.collection("triggers-words");
        collection.find({}).toArray(function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

module.exports.connect = connect;*/
// v2
/*const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
    try {
        await mongoose.connect(process.env.MONGO_TOKEN, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const collection = mongoose.connection.db.collection("triggers-words");
        return new Promise((resolve, reject) => {
            collection.find({}).toArray(function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    console.log(chalk.blue(chalk.bold(`Systeme`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`est prêt !`))
                    resolve(data);
                }
            });
        });
    } catch (err) {
        console.error(chalk.red.bold("Failed to connect to MongoDB:"));
        console.error(err);
        process.exit(1);
    }
}

module.exports.connect = connect;*/
const mongoose = require('mongoose');
const chalk = require('chalk');

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_TOKEN, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(chalk.blue(chalk.bold(`Systeme`)), (chalk.white(`>>`)), chalk.red(`MongoDB`), chalk.green(`est prêt !`));
    
    const collection = mongoose.connection.db.collection("triggers-words");
    const triggerWords = await collection.find({}).toArray();
    
    return triggerWords;
  } catch (error) {
    console.error(chalk.red(`Erreur de connexion à MongoDB: ${error}`));
  }
}

module.exports = { connect };