// Import required files
const Discord = require("discord.js");
const PermissionsController = require("../controllers/PermissionsController");
const Models = require("../models/AllModels");

module.exports = {

    // Set config values
    name: 'leaderboard',
    enabled: true,
    mod: false,
    super: false,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`leaderboard`)
    .setDescription(`Display the 10 members with the most points in the GeekBeacon Discord!`),

    async execute(interaction) {
        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);
        
        // If the command is disabled then let the user know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});
        // If the command isn't disabled, proceed
        } else {
            // If the member doesn't have the proper permissions for the command
            if(!approved) {
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

            // If the member has the proper permissions for the command
            } else {
                // Find the top 10 users and order by points
                Models.user.findAll({order:[['points', 'DESC']],limit:10,raw:true}).then((top) => {
                    // Ensure the data was found
                    if(top) {
                        let topEmbed = new Discord.EmbedBuilder()
                            .setColor(`#551CFF`)
                            .setTitle(`GeekBeacon Leaderboard`)
                            .setDescription(`These users have the most points within the GeekBeacon Discord!`)
                            .setTimestamp();

                        top.forEach((u) => {
                            let user;

                            // Try to get the user
                            try {
                                user = interaction.guild.members.cache.get(u.user_id);
                            } catch(e) {
                                // Only causes an error if the user can't be found (left the server or got banned from Discord for example)
                            }

                            // If the user isn't found
                            if(!user) {
                                user = "Unknown User";
                            }

                            // Look through the array of users and find the one with the correct ID
                            rank = top.map(function (e) {
                                return e.user_id;
                            }).indexOf(u.user_id);

                            // Add each user to the list
                            topEmbed.addFields({name: `Rank #${rank+1}`, value: `${user} - ${u.points}`,inline: false});

                        });
                        interaction.reply({embeds:[topEmbed]});
                    }
                });
            }
        }
    }
}
