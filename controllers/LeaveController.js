// Import required files
const moment = require("moment");
const momentDuration = require("moment-duration-format");
const Discord = require("discord.js")

// Create a new module export
module.exports = {
    leaveHandler: function(m, c) {

        // Link moment-duration-format with moment
        momentDuration(moment);

        const member = m, client = c;
        const modLog = member.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        const joinedDate = member.joinedAt; // joined date
        const joinedTimeStamp = moment(member.joinedTimestamp); // timestamp user joined
        const currentTime = moment(); // create a new moment obj with current time
        const memberLength = moment.duration(currentTime.diff(joinedTimeStamp)).format("Y[y] D[d] H[h] m[m] s[s]"); //get the duration of the membership and format it

        // Create the leave embed
        const leaveEmbed = {
            color: 0xff5500,
            title: `Member Left`,
            author: {
                name: `${member.user.tag}`,
                icon_url: `${member.displayAvatarURL({dynamic: true})}`
            },
            description: `${member} has left the server\n*${member.guild.name} now has ${member.guild.memberCount} members*`,
            fields: [
                {
                    name: `User`,
                    value: `${member.displayName}`,
                    inline: true,
                },
                {
                    name: `Account Made`,
                    value: `${Discord.time(member.user.createdAt, "R")}`,
                    inline: true,
                },
                {
                    name: `Joined Server`,
                    value: `${Discord.time(joinedDate, "R")}`,
                    inline: true,
                },
                {
                    name: `Membership Duration`,
                    value: `${memberLength}`,
                    inline: true,
                }
            ],
            timestamp: new Date(),
            footer: {
                text: `User ID: ${member.user.id}`
            }
        };

        // Send the leave embed to the mod log
        modLog.send({embeds: [leaveEmbed]});

    }
}