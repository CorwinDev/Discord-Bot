const axios = require('axios');

const getMarketplaceData = async () => {
    const url = "https://www.unrealengine.com/marketplace/api/assets?lang=en-US&start=0&count=20&sortBy=effectiveDate&sortDir=DESC&tag[]=4910";
    const response = await axios.get(url);
    console.log("Getting Marketplace Data...");
    return response.data;
};

const generateMessage = (marketplaceData) => {
    var generatedEmbeds = [];
    var generatedAttachments = [];
    var sumPrice = 0;
    const color = Math.floor(Math.random() * 9999999);
    const timestamp = new Date();
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const month = monthNames[timestamp.getMonth()];
    const year = timestamp.getFullYear().toString();

    for (const element of marketplaceData.data.elements) {

       // Getting only screenshots of Environments Assets because it is better
        if (element.categories[0].name == "Environments" && generatedAttachments.length < 6) {
            console.log(element.keyImages[Math.floor(Math.random() * 10)].url.replace(/ /g, '%20'));
            generatedAttachments.push( 
                {
                "attachment": element.keyImages[Math.floor(Math.random() * 10)].url.replace(/ /g, '%20'),
                }
            )
            generatedAttachments.push( 
                {
                "attachment": element.keyImages[11].url.replace(/ /g, '%20'),
                }
            )
        }
        // Populating Embeds
        sumPrice = sumPrice + parseFloat(element.price.substring(1));
        generatedEmbeds.push(
            {
                "type": "rich",
                "title": element.title,
                "url": `https://www.unrealengine.com/marketplace/en-US/product/${element.urlSlug}`,
                "description": "> ➜  " + element.description,
                "color": color,
                "fields": [
                    {
                        "name": "Auteur",
                        "value": `[${element.seller.name}](https://www.unrealengine.com/marketplace/en-US/profile/${element.seller.name.replace(/\s+/g, '+')})`,
                        "inline": true
                    },
                    {
                        "name": "Prix initial",
                        "value": element.price.substring(1) + " " + element.price.charAt(0),
                        "inline": true
                    },
                    {
                        "name": "Note",
                        "value": element.rating.averageRating + " sur 5 ★",
                        "inline": true
                    }
                ],
                "author": {
                    "name": "",
                    "icon_url": ""
                },
                "image": {
                    "url": "",
                    "height": 0,
                    "width": 0
                },
                "thumbnail": {
                    "url": element.thumbnail,
                    "height": 1,
                    "width": 1
                },
                "footer": {
                    "text": element.categories[0].name
                  },
                "timestamp": element.releaseInfo[element.releaseInfo.length - 1].dateAdded
            }
        );
    }
    generatedAttachments = generatedAttachments.sort(() => Math.random() - 0.5)

    var generatedComponents = [
        {
            "type": 1,
            "components": [
                {
                "style": 5,
                "label": `Ouvrir la page du Marketplace`,
                "url": `https://www.unrealengine.com/marketplace/en-US/assets?tag=4910`,
                "disabled": false,
                "type": 2
                },
                {
                "style": 5,
                "label": `Ouvrir l'article du Blog`,
                "url": `https://www.unrealengine.com/en-US/blog/featured-free-unreal-marketplace-content-${month}-${year}`,
                "disabled": false,
                "type": 2
                }
            ]
        }
    ]

    return [{
        "content": `## Hey les <@&1043586201975795784>\nLes Freebies Unreal du mois sont disponibles sur le **Marketplace** ! (Valeur : ${sumPrice} €)\n⠀`,
        //"allowedMentions": { "repliedUser": true },
        "tts": false,
        "embeds": generatedEmbeds
    },
    {
        "content": "",
        "tts": false,
        "files": generatedAttachments,
        "components": generatedComponents
    }
];
}

const sendMessage = async (client, webhookData) => {
    /*const webhookUrl = "https://discord.com/api/webhooks/1043692710722281473/AXoc36oig4YUOTjH0N0h77YH6SSot46QkmQVVcZH34Zevbs4bVaEHmiZ6VqLUg8gzf7x";
    try {
        const result = await axios.post(webhookUrl, webhookData);
        console.log(`Payload delivered successfully, code ${result.status}.`);
    } catch (error) {
        console.error(error.message);
    }*/
    //const channel = client.channels.cache.get(1018156441883906138);
    client.notifyFreebiesChannel.send(webhookData);
};

module.exports = {
    getMarketplaceData,
    generateMessage,
    sendMessage,
};