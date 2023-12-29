const Devs = require("../../database/models/developers");
const Discord = require('discord.js');
const axios = require('axios');
const {getMarketplaceData, generateMessage, sendMessage} = require('../../assets/utils/unrealFreebiesFunctions.js');

module.exports = (client) => {
    client.on('ready',() => {
        if (process.env.DEV) {
        // Test purpose only
            client.notifyFreebiesChannel = client.channels.cache.get("1190304172013256806");
        } else {
            client.notifyFreebiesChannel = client.channels.cache.get("808714316462686218");
        }
        
    });
    /* Test purpose only*/
    if (process.env.DEV) {
        client.on(Discord.Events.MessageCreate, async (message) => {
            if (message.channel.type === Discord.ChannelType.DM) return;
            if (message.author.bot) return;
            try {

                    const messageStripped = message.content.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
                    const regex = new RegExp("test", "gi");
                    const args = messageStripped.match(regex);

                    if(args) {
                        await notifyFreebiesAndUpdateDate();;
                    }
            } catch (err) {
                console.error(err);
            }
        }).setMaxListeners(0);
    }

    const notifyFreebiesAndUpdateDate = async () => {
        console.log('Notifying about freebies...');
        // Add your notification logic here
        try {
            const marketplaceData = await getMarketplaceData();
            const messageData = generateMessage(marketplaceData);
            await sendMessage(client, messageData[0]);
            await sendMessage(client, messageData[1]);
        } catch (error) {
            console.log("Error sending Unreal Freebies");
            console.log(error);
        }

        // Update the stored date to now + 1 month
        const currentDate = new Date();
        const nextMonthDate = new Date(currentDate);
        nextMonthDate.setMonth(currentDate.getMonth() + 1);

        const getLastDate = await Devs.findOne({ Action: "Freebies" }).exec();

        if (getLastDate) {
            getLastDate.Date = nextMonthDate;
            getLastDate.save();
        }
    };

    const checkFreebies = async () => {
        try {
            const currentDate = new Date();
            const lastStoredDate = await Devs.findOne({ Action: "Freebies" }).exec();
    
            if (lastStoredDate) {
                const storedDate = new Date(lastStoredDate.Date);
    
                // Check if the current time is later than or equal to the stored time
                if (currentDate.getTime() >= storedDate.getTime()) {
                    notifyFreebiesAndUpdateDate();
    
                    // Update the stored date to the 15th of the next month at 16:30 Brussels time
                    const nextMonthDate = new Date(currentDate);
                    nextMonthDate.setMonth(currentDate.getMonth() + 1);
                    nextMonthDate.setDate(15);
                    nextMonthDate.setHours(16, 30, 0, 0); // Set the time to 16:30
    
                    lastStoredDate.Date = nextMonthDate;
                    await lastStoredDate.save();
                }
            } else {
                // If no stored date found, set the date to the 29th of the current or next month at 16:30
                const nextMonthDate = new Date(currentDate);
                nextMonthDate.setDate(15);
                nextMonthDate.setHours(16, 30, 0, 0); // Set the time to 16:30
    
                // If the 15th of the current month has already passed and the current time is after 16:30, set to the next month
                if (currentDate.getDate() >= 15 && currentDate.getTime() >= nextMonthDate.getTime()) {
                    nextMonthDate.setMonth(currentDate.getMonth() + 1);
                }
    
                await new Devs({
                    Action: "Freebies",
                    Date: nextMonthDate,
                }).save();
            }
    
            setTimeout(checkFreebies, 1000 * 10); // Adjust the timeout as needed
        } catch (error) {
            console.error("Error in checkFreebies:", error);
            // Add additional error handling as needed
        }
    };
    
    // Initial call to start the checkFreebies loop
    checkFreebies();
    
    
};