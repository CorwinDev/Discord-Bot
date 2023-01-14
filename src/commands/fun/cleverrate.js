
module.exports = async (client, interaction, args) => {

    var result = Math.ceil(Math.random() * 100);

    client.embed({
        title: `💡・Clever Rate`,
        desc: `You are ${result}% clever!`,
        type: 'editreply'
    }, interaction)
}

 