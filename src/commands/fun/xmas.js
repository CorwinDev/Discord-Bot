module.exports = async (client, interaction, args) => {
    let today = new Date();
     let xmas = new Date(today.getFullYear(), 11, 24);
     if (today.getMonth() == 11 && today.getDate() > 24) {
         xmas.setFullYear(xmas.getFullYear() + 1);
     }
     let one_day = 1000 * 60 * 60 * 24;
     let daysleft = Math.ceil((xmas.getTime() - today.getTime()) / (one_day));
     let days = daysleft + 1

 client.embed({
         title: `🎄・Christmas`,
         desc: `${days} days until Christmas`,
     type: 'editreply'
 }, interaction)
}

