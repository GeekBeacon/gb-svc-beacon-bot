// Import required files
const Models = require("../models/AllModels");
const Discord = require("discord.js");

// Create a new module export
module.exports = {

    // Create a function to be called
    joinHandler: async function(m, c) {
        const member = m, client = c; //assign the member var to the passed in member parameter
        const joinLog = member.guild.channels.cache.find((c => c.name.includes(client.settings.get("join_log_channel_name")))); //join log channel
        let warnings = 0;

        await Models.warning.findAll({where:{user_id: member.user.id}, raw: true}).then((warns) => {
            if(warns) {
                warnings = warns.length;
            }
        })

        // Create the embed to display a new member join
        const joinEmbed = {
            color: 0x886CE4, //purple
            title: `New Member`,
            description: `${member} has just joined the server!\n*${member.guild.name} now has ${member.guild.memberCount} total members!*`,
            fields: [
                {
                    name: `User`,
                    value: `${member.displayName}`,
                    inline: true,
                },
                {
                    name: `Warnings`,
                    value: `${warnings}`,
                    inline: true,
                },
                {
                    name: `Registered`,
                    value: `${Discord.time(member.user.createdAt, "R")}`,
                    inline: false,
                },
            ],
            timestamp: new Date(),
            footer: {
                text: `User ID: ${member.user.id}`,
            }
        }

        // Send the embed to the action log channel
        await joinLog.send({embeds: [joinEmbed]});

    },
    screeningHandler: async function(o,n) {
        const oldMember = o, newMember = n; //assign the member var to the passed in member parameter
        const roles = []; //create the roles array

        // If the member is no longer pending (going through the screening)
        if(newMember.pending !== oldMember.pending) {

            // Query the db for all the autoroles
            Models.autorole.findAll({raw: true}).then(async (data) => {

                // See if there are any autoroles in the db
                if (data) {
                    // Find the role within the server and add it to the array
                    data.forEach(item => {
                        const role = newMember.guild.roles.cache.find(role => role.name === item.role)
                        roles.push(role);
                    });
                }
            }).then(async () => {

                // Edit the member and add all autoroles to that user
                newMember.edit({roles: roles}, "Added Autoroles");
            });
        }
    }
}
