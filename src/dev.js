/*
* This file adds a developer badge to a user 
* Only use this if you want to add a badge to a user
* If someone tells you to use this to add their id, they are lying 
* 
* @string member - The member you want to add the badge to
*/
const chalk = require('chalk');
if (!process.argv[2]) {
    console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Developer Badge`), chalk.white(`>>`), chalk.red(`Please provide a member id!`))
    process.exit(1);
}
require('dotenv').config('./.env');
// Require database
const mongoose = require('mongoose');
// Require the model
const model = require('./database/models/badge.js');
// Connect to the database
mongoose.set('strictQuery', false);
// Await the connection
mongoose.connect(process.env.MONGO_TOKEN, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(chalk.green(`[SUCCESS]`), chalk.white(`>>`), chalk.green(`Developer Badge`), chalk.white(`>>`), chalk.green(`Connected to the database!`))
}).catch((err) => {
    console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Developer Badge`), chalk.white(`>>`), chalk.red(`Failed to connect to the database!`))
    console.log(err)
    process.exit(1);
});
// Find the user
model.findOne({
    User: process.argv[2]
}, async (err, data) => {
    if (err) console.log(err);
    if (!data) {
        // Create a new document
        const newData = new model({
            User: process.argv[2],
            FLAGS: [
                "DEVELOPER"
            ]
        });
        try {
            await newData.save();
        } catch (err) {
            console.log(err)
        }
        console.log((chalk.white(`>>`)), chalk.red(`Developer Badge`), chalk.green(`has been added to the user!`))
        mongoose.connection.close();
        process.exit(0);
    }
    if (data) {
        // Update the document
        data.FLAGS.push("DEVELOPER");
        try {
            await data.save();
        } catch (err) {
            console.log(err)
        }
        console.log((chalk.white(`>>`)), chalk.red(`Developer Badge`), chalk.green(`has been added to the user!`))
        mongoose.connection.close();
        process.exit(0);
    }
});