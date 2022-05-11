const fetch = require("node-fetch");

module.exports = async (client, interaction, args) => {

    fetch(`https://some-random-api.ml/meme`).then((res) => res.json()).catch({})
        .then(async (json) => {

            client.embed({
                title: json.caption,
                image: json.image,
                type: 'editreply'
            }, interaction)
        }).catch({})
}

 