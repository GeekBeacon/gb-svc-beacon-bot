// Import required files
const moment = require("moment");
const Models = require("../models/AllModels");
const Discord = require('discord.js');

module.exports = {
    emojiRoleHandler: async function(message, args, client) {
        const prefix = client.settings.get("prefix");

        // Run the proper function based on the subcommand given
        switch(args[0].toLowerCase()) {
            case "create":
                createPost();
                break;
            case "add":
                addRole();
                break;
            case "remove":
                removeRole();
                break;
            default:
                break;
        }

        // Function to create the initial post for emoji roles
        function createPost() {
            // Make sure the user is an admin
            if(message.member.roles.cache.some(role => role.id === client.settings.get("admin_role_id")) || message.author.id === message.member.guild.ownerId) {
                let roleEmojiArr = []; //array for all the roleEmojiObjs

                // Get all roles from the joinables table in the db
                Models.joineableRole.findAll({raw:true}).then(async (roles) => {
                    // Ensure data was found
                    if(roles.length) {


                        // Loop through the roles and ask the user to provide a reaction for each one.
                        for (const item of roles) {
                            // Find the role
                            const role = message.guild.roles.cache.find(role => role.name.toLowerCase().includes(item.role.toLowerCase()));

                            // Reaction filter
                            const reactionFilter = m => {
                                // Make sure the author is the same as the command user then continue when the user types "done"
                                if(m.author.id === message.author.id && m.content.toLowerCase() === "done") {
                                    return true;
                                }
                            }

                            // Ask the user for the channel the announcement should be posted to then assign the resolved promise's value to the channel of the announcement
                            await message.reply(`Please tell me the reaction you wish to use for ${role.name}. Type \`\`done\`\` when completed!`).then(async (botMsg) => {
                                // Listen for the response (5 min wait) and return it
                                await message.channel.awaitMessages({filter: reactionFilter, max: 1, time: 300000, errors:["time"]}).then(res => {

                                    // Check if a user added any reactions
                                    if(botMsg.reactions.cache.size > 0) {

                                        // Create object to hold the emoji and role combination
                                        const roleEmojiObj = {
                                            role_id: role.id,
                                            emoji: botMsg.reactions.cache.first().emoji.toString()
                                        };

                                        // Add the roleEmojiObj to the roleEmojiArr
                                        roleEmojiArr.push(roleEmojiObj);
                                    }
                                // If the user goes idle for 5 mins let them know they timed out
                                }).catch(e => {
                                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                                });
                            })
                        }

                        // Create the Embed

                        // Ask the user if the post looks correct

                        // If yes, add to DB
                            // Then create the post
                        // If no then cancel
                    }
                })
            }
        }

        // Function to add a role to the post to be joinable
        function addRole() {

        }

        // Function to remove a role from the post to become unjoinable
        function removeRole() {

        }
    }
}