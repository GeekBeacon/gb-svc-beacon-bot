const Models = require("../../models/AllModels");
const Discord = require("discord.js");

module.exports = {
    name: "leaderboard",
    description: "Display the 10 members with the most points in the GeekBeacon Discord!",
    aliases: ["top", "rankings"],
    usage: " ",
    cooldown: 5,
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    execute(message) {
        // Find the top 10 users and order by points
        Models.user.findAll({order:[['points', 'DESC']],limit:10,raw:true}).then((top) => {
            // Ensure the data was found
            if(top) {
                let topEmbed = new Discord.MessageEmbed()
                    .setColor(`#551CFF`)
                    .setTitle(`GeekBeacon Leaderboard`)
                    .setDescription(`These users have the most points within the GeekBeacon Discord!`)
                    .setTimestamp(new Date());

                top.forEach((u) => {
                    let user;

                    // Try to get the user
                    try {
                        user = message.guild.members.cache.get(u.user_id);
                    } catch(e) {
                        // If unable to get the user, set to Unknown User
                        user = "Unknown User"
                    }

                    // Look through the array of users and find the one with the correct ID
                    rank = top.map(function (e) {
                        return e.user_id;
                    }).indexOf(u.user_id);

                    topEmbed.addField(`Rank #${rank+1}`,`${user} - ${u.points}`,false)

                });
                message.channel.send({embeds:[topEmbed]});
            }
        })
    }
}
