
module.exports = async (client, interaction, args) => {
    var result = Math.ceil(Math.random() * 100);

    client.embed({
        title: `👀・Simp rate`,
        desc: `You are ${result}% simp!`,
        type: 'editreply'
    }, interaction)
}

 