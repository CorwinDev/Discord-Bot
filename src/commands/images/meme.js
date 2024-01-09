const fetch = require("node-fetch");
const { MessageEmbed } = require('discord.js');

module.exports = async (client, interaction, args) => {
    fetch(`https://www.reddit.com/r/memes/random/.json?sort=top&t=week&limit=100`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.text(); // Return response as text for further examination
        })
        .then(async (responseText) => {
            // Log the response body for investigation
            console.log('Response body:', responseText);

            // Handle parsing JSON if the response is expected to be JSON
            // ... Your JSON parsing logic goes here ...
            
            // For example:
            // const json = JSON.parse(responseText);
            // ... Rest of your code for embedding ...

            interaction.editReply('Error parsing response. Please check logs.');
        })
        .catch((err) => {
            console.error('Error fetching meme:', err);
            interaction.editReply('Error fetching meme. Please try again later.');
        });
};

