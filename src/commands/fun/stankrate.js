
module.exports = async (client, interaction, args) => {
    var result = Math.ceil(Math.random() * 100);

    client.embed({
        title: `💨・Stank rate`,
        desc: `You are ${result}% stanky!`,
        type: 'editreply'
    }, interaction)
}

 