const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
module.exports = async (client) => {
    const regex = {
        teleparty: /\bhttps?:\/\/redirect\.teleparty\.com\/join\/[a-f0-9]+\b/i,
        primeparty: /\bhttps?:\/\/(?:www\.)?(?:watchparty\.amazon|primevideo\.com)\/(?:[\w-]+\/)*amzn1\.dv\.wp\.room\.[\w-]+\b/i,
        primeparty2: /https:\/\/www\.primevideo\.com\/watchparty\//,
        watchpartyme: /\bhttps?:\/\/www\.watchparty\.me\/#[\w-]+\b/i,
        disneyparty: /\bhttps?:\/\/www\.disneyplus\.com(?:\/\w{2}-\w{2})?\/groupwatch\/[\w-]+\b/i,
        imgUrl: /(https?:\/\/.*\.(?:png|webp|jpg|jpeg|gif))/i
    };
    client.on(Discord.Events.MessageCreate, async (message) => {
        if (message.channel.type === Discord.ChannelType.DM) return;
        if (message.author.bot) return;
        try {
            // Initialize the variables
            var support = "";
            var videoId = "";
            var watchparty = false;
            var icon = "";
            var cleanedMessage = message.content;
            var messageOnlyLink = false;
            var color = 0xff0000;
            var fields = [{
              "name": "",
              "value": ""
            }];
            let title = undefined;
            var titleFound = false;
            var imageUrl = "";

            function fetchJsonData(url) {
              return new Promise((resolve, reject) => {
                https.get(url, (response) => {
                  let data = '';
            
                  response.on('data', (chunk) => {
                    data += chunk;
                  });
            
                  response.on('end', () => {
                    try {
                      const jsonData = JSON.parse(data);
                      resolve(jsonData);
                    } catch (error) {
                      reject(error);
                    }
                  });
                }).on('error', (error) => {
                  reject(error);
                });
              });
            }

            function axiosHtml(url, selector) {
              return undefined;
              return new Promise((resolve, reject) => {
                axios.get(url)
                  .then(response => {
                    const html = response.data;
                    const $ = cheerio.load(html);
                    const text = $(selector).text();
                    if (text === "") {
                      resolve(undefined);
                    } else {
                      resolve(text);
                    }
                  })
                  .catch(error => {
                    reject("Une erreur s'est produite : " + error);
                  });
              });
            }

            


            /*
                        Teleparty
            */
            const teleparty = message.content.match(regex.teleparty);
            if(teleparty){
              url = teleparty[0];
              var temp = url.split("https://redirect.teleparty.com/join/")[1];
              temp = "https://api.teleparty.com/video?session=" + temp;
              const jsonData = await fetchJsonData(temp);
              //console.log(jsonData);

              // Streaming platform parameters
              support = "Teleparty";
              watchparty = true;
              support = jsonData.videoService;
              videoId = jsonData.videoId;
              cleanedMessage = cleanedMessage.replace(regex.teleparty, `<:teleparty:1110295762300055653> [lien](${url})`);
            }

            /*
                        Netflix
            */
            if (support == "netflix") {
              title = await axiosHtml("https://www.netflix.com/watch/" + videoId, 'h1.title-title');
              console.log(title.error);
              if (title != undefined) titleFound = true;
              
              cleanedMessage = cleanedMessage.replace(regex.teleparty, `[\[lien\]](${url})`);
              messageOnlyLink = regex.teleparty.test(cleanedMessage);

              // Streaming platform parameters
              support = "Netflix";
              icon = "https://venturebeat.com/wp-content/uploads/2016/06/netflix-logo.png?w=1200&strip=all";
              color = 0x00A8E1;
            }

            /*
                        PrimeVideo
            */
            if (message.content.match(regex.primeparty) || support == "amazon") {
              if (support == "amazon") {
                // Teleparty watchparty
                title = await axiosHtml("https://www.primevideo.com/dp/" + videoId, 'h1[data-automation-id="title"]');
              } else {
                // Native watchparty
                url = message.content.match(regex.primeparty)[0];
                /*if (url.match(regex.primeparty2)) {
                  title = await axiosHtml(url, 'p._36qUej.uTtQT3');
                };*/
                cleanedMessage = cleanedMessage.replace(regex.primeparty, `[\[lien\]](${url})`);
                messageOnlyLink = regex.primeparty.test(cleanedMessage);
              }
              if (title != undefined) titleFound = true;
              console.log(title);
              

              // Streaming platform parameters
              support = "Prime Video";
              icon = "https://store-images.s-microsoft.com/image/apps.42667.14618985536919905.4b30e4f3-f7a1-4421-840c-2cc97b10e8e0.e2d07496-243f-458a-b5ef-e3249f7bb71f";
              color = 0x00A8E1;
              watchparty = true;
            }

            /*
                        Disney+
            */
            if (message.content.match(regex.disneyparty) || support == "disney") {
              
              if (support == "disney") {
                // Teleparty watchparty
                title = await axiosHtml("https://www.disneyplus.com/fr-fr/video/" + videoId, 'h1.h3.padding--bottom-6.padding--right-6.text-color--primary');
                if (title != undefined) titleFound = true;
                console.log(title);
              } else {
                // Native watchparty
                url = message.content.match(regex.disneyparty)[0];
                if (url.match(regex.disneyparty)) {
                  videoId = url.split("https://www.primevideo.com/watchparty/")[1];
                  
                  title = await axiosHtml("https://www.primevideo.com/dp/" + videoId, 'h1[data-automation-id="title"]');
                };
                cleanedMessage = cleanedMessage.replace(regex.disneyparty, `[\[lien\]](${url})`);
                messageOnlyLink = regex.disneyparty.test(cleanedMessage);
              }
              
              // Streaming platform parameters
              support = "Disney+";
              icon = "https://seeklogo.com/images/D/disney-logo-9649A88458-seeklogo.com.png";
              color = 0x153866;
              watchparty = true;
            };
            /*
                        Watchparty.me
            */
            if (message.content.match(regex.watchpartyme) || support == "watch") {
              cleanedMessage = cleanedMessage.replace(regex.watchpartyme, `[\[lien\]](${url})`);
              messageOnlyLink = regex.watchpartyme.test(cleanedMessage);

              // Streaming platform parameters
              support = "Watchparty.me";
              icon = "https://www.saashub.com/images/app/service_logos/183/j18sqik9nu3s/large.png?1626896447";
              color = 0xff0000;
              watchparty = true;
              url = watchpartyme[0];
            };



            if(imageUrl == "") {
              if(regex.imgUrl.test(message.content)) {
                var urlMatched = message.content.match(regex.imgUrl)
                cleanedMessage = cleanedMessage.replace(regex.imgUrl, ``);
                imageUrl = urlMatched[0];
              }
              const firstAttachment = message.attachments.first();
              if (firstAttachment) {
                imageUrl = firstAttachment.url
              }
            };

            if (watchparty) {
              
            
                if(titleFound) {
                  var embedDescription = `\n\n**${message.author}** t'a invité à regarder **${title}** sur **${support}** !`;
                  
                } else {
                  var embedDescription = `\n\n**${message.author}** t'a invité à regarder sur **${support}** !`;
                }
                if (!messageOnlyLink) {
                  fields = [{
                    "name": ``,
                    "value": `> ${cleanedMessage}`
                  }]
                };
                
                /*
                          Logs
                */
               console.log(titleFound ? `Watchparty de ${message.author.username} sur ${support} pour ${title}` : `par ${message.author} sur ${support}`);


                embed = {
                  "channel_id": message.channel_id,
                  "content": "",
                  "tts": false,
                  "attachments": message.attachments[0],
                  "components": [
                    {
                      "type": 1,
                      "components": [
                        {
                          "style": 5,
                          "label": `Rejoindre la Watch Party`,
                          "url": url,
                          "disabled": false,
                          "type": 2
                        }
                      ]
                    }
                  ],
                  "embeds": [
                    {
                      "type": "rich",
                      "title": ``,
                      "description": embedDescription,
                      "color": color,
                      "fields": fields,
                      "author": {
                        "name": "Watch Party",
                        "icon_url": `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.webp`
                      },
                      "image": {
                        "url": imageUrl,
                        "height": 0,
                        "width": 0
                      },
                      "thumbnail": {
                        "url": icon,
                        "height": 1,
                        "width": 1
                      }
                    }
                  ]
                };
                message.delete({ timeout: 5000 });
                message.channel.send(embed);
                // Delete the original message
                
            }
        } catch (err) {
            console.error(err);
        }
    }).setMaxListeners(0);
};