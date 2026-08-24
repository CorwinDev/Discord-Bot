const mongoose = require("mongoose");
const { Chalk } = require("chalk");
const chalk = new Chalk();
const cache = require("ts-cache-mongoose");

cache.init(mongoose, {
  engine: "memory",
  defaultTTL: "60 seconds",
  maxEntries: 5000,
});

async function connect() {
  mongoose.set("strictQuery", false);
  try {
    console.log(
      chalk.blue(chalk.bold(`Database`)),
      chalk.white(`>>`),
      chalk.red(`MongoDB`),
      chalk.green(`is connecting...`),
    );
    await mongoose.connect(process.env.MONGO_TOKEN);
  } catch (err) {
    console.log(
      chalk.red(`[ERROR]`),
      chalk.white(`>>`),
      chalk.red(`MongoDB`),
      chalk.white(`>>`),
      chalk.red(`Failed to connect to MongoDB!`),
      chalk.white(`>>`),
      chalk.red(`Error: ${err}`),
    );
    console.log(chalk.red("Exiting..."));
    process.exit(1);
  }

  mongoose.connection.once("open", () => {
    console.log(
      chalk.blue(chalk.bold(`Database`)),
      chalk.white(`>>`),
      chalk.red(`MongoDB`),
      chalk.green(`is ready!`),
    );
  });

  mongoose.connection.on("error", (err) => {
    console.log(
      chalk.red(`[ERROR]`),
      chalk.white(`>>`),
      chalk.red(`Database`),
      chalk.white(`>>`),
      chalk.red(`Failed to connect to MongoDB!`),
      chalk.white(`>>`),
      chalk.red(`Error: ${err}`),
    );
    console.log(chalk.red("Exiting..."));
    process.exit(1);
  });
  return;
}

module.exports = connect;
