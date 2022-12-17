/*
* This file adds a developer badge to a user 
* Only use this if you want to add a badge to a user
* If someone tells you to use this to add their id, they are lying 
* 
* @string member - The member you want to add the badge to
*/ 
require('dotenv').config('./.env');
// Require database
const mongoose = require('mongoose');
// Require the model
const model = require('./database/models/badge.js');
const chalk = require('chalk');
// Connect to the database
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_TOKEN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
if(!process.argv[2]) {
    console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Developer Badge`), chalk.white(`>>`), chalk.red(`Please provide a member id!`))
    process.exit(1);
}
// Find the user
model.findOne({
    User: process.argv[2]
}, async (err, data) => {
    if(err) console.log(err);
    if(!data) {
        // Create a new document
        const newData = new model({
            User: process.argv[2],
            FLAGS: [
                "Developer"
            ]
        });
        newData.save();
        console.log((chalk.white(`>>`)), chalk.red(`Developer Badge`), chalk.green(`has been added to the user!`))
        mongoose.connection.close();
        process.exit(0);
    }
    if(data) {
        // Update the document
        data.FLAGS.push("Developer");
        data.save();
        console.log((chalk.white(`>>`)), chalk.red(`Developer Badge`), chalk.green(`has been added to the user!`))
        mongoose.connection.close();
        process.exit(0);
    }
});