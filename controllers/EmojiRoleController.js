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
        async function createPost() {
            // Make sure the user is an admin
            if(message.member.roles.cache.some(role => role.id === client.settings.get("admin_role_id")) || message.author.id === message.member.guild.ownerId) {
                let roleEmojiArr = []; //array for all the roleEmojiObjs
                let channelId;

                const channelFilter = m => {
                    // Ensure the user replied with ONLY a channel mention
                    if(m.author.id === message.author.id && m.content.match(/(^<#[0-9]+>$)/)) {
                        return true;
                    // If the response wasn't just a channel mention let them know.
                    } else if(m.author.id === message.author.id) {
                        message.reply(`Uh oh! It seems that you didn't provide me with a channel to post to.\nPlease tag the channel you wish to post this announcement to.\nMake sure you are **only** replying with the channel object (\`\`#channel\`\`)!`)
                    }
                }


                // Ask the user for the channel the announcement should be posted to then assign the resolved promise's value to the channel of the announcement
                channelId = await message.reply(`Which channel would you like this post to be posted in?\nPlease be sure to tag it using \`\`#channel-name\`\`!`).then(() => {
                    // Listen for the response (30 sec wait) and return it
                    return message.channel.awaitMessages({filter: channelFilter, max: 1, time: 30000, errors:["time"]}).then(res => {
                        // Make sure res is valid
                        if(res) {
                            // Return just the channel id from the channel object
                            return res.first().content.replace(/[<#>]/g, ``)
                        }
                    // If the user goes idle for 30 seconds let them know they timed out
                    }).catch(e => {
                        message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                    });
                })

                // Get all roles from the joinables table in the db
                Models.joineableRole.findAll({raw:true}).then(async (roles) => {
                    // Ensure data was found
                    if(roles.length) {


                        // Loop through the roles and ask the user to provide a reaction for each one.
                        for (const item of roles) {
                            // Find the role
                            const role = message.guild.roles.cache.find(role => role.name.toLowerCase().includes(item.role.toLowerCase()));

                            // Reaction filter
                            const reactionFilter = (r,u) => {
                                const thxRegex = /\b([A-Za-z]*?thx*|thanks|ty*|thank\s*you*)\b/; //regex to look for different forms of thanks

                                // Make sure the author is the same as the command user
                                if(r && u.id === message.author.id) {

                                    // If a "thanks" emojis was used, reject it and let them know
                                    if(r.emoji.name.toLowerCase().match(thxRegex) && r.emoji.guild.id === r.message.guildId) {
                                        message.reply(`Uh oh! Looks like you tried to use an emoji that is reserved for the point system, please choose a different one!`);
                                    } else {
                                        return true;
                                    }
                                }
                            }

                            // Ask the user for the channel the announcement should be posted to then assign the resolved promise's value to the channel of the announcement
                            await message.reply(`Please tell me the reaction you wish to use for ${role.name}. Type \`\`done\`\` when completed!\nNote: Only one reaction is accepted, so make sure you choose the correct emoji!`).then(async (botMsg) => {
                                // Listen for the response (5 min wait) and return it
                                await botMsg.awaitReactions({filter: reactionFilter, max: 1, time: 300000, errors:["time"]}).then(() => {

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

                        // Get the channel
                        const channel = message.guild.channels.cache.get(channelId);

                        // Create the Embed
                        let confirmEmbed = new Discord.MessageEmbed()
                            .setColor(`#551CFF`) //purple
                            .setTitle(`Joinable Roles`)
                            .setDescription(`Below are all of the roles that are currently joinable. Simply click on the corresponding reaction/emoji to join the role.\nAlternatively, you can click on it again to leave the role.\n\n*Note: If joined a role via the command, you can simply click on the emoji to add yourself to it and then click again to leave the role.*`)
                            .addField(`Channel (this field won't be on the public post)`, `${channel}`, false)
                        // Loop through each item in the roleEmojiArr
                        roleEmojiArr.forEach((item) => {
                            // Get the role object
                            const role = message.guild.roles.cache.get(item.role_id);
                            // Add a new field with the role and emoji
                            confirmEmbed.addField(`\u200B`, `**${role} - ${item.emoji}**`, false);
                        });


                        const yesNoFilter = m => {
                            // If user says "yes" or "no" then return true
                            if(m.author.id === message.author.id && (m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no")) {
                                return true;
                            }
                        }

                        // Ask the user if the post looks correct
                        message.channel.send({content: `Does this look correct to you? (Wait for the reactions to be added)`, embeds:[confirmEmbed]}).then(async (msg) => {

                            // Loop through the roleEmojiArr and add each reaction to the message
                            roleEmojiArr.forEach((reaction) => {
                                msg.react(`${reaction.emoji}`);
                            });

                             // Listen for the response (5 min wait) and return it
                             await message.channel.awaitMessages({filter: yesNoFilter, max: 1, time: 300000, errors:["time"]}).then((res) => {
                                
                                // Get the user's response
                                const answer = res.first().content;
                        
                                // If the user said it was incorrect, let them know to fix the problem(s)
                                if(answer.toLowerCase() === "no") {
                                    return res.first().reply(`Uh oh! Don't worry, I've not saved it, but please run the command again and correct the emojis that were incorrect.`);

                                // If the user confirmed it was correct
                                } else if (answer.toLowerCase() === "yes") {
                                    let dbItems = []; //array for the ids of the newly created db rows
                                    /* 
                                    * Sync the model to the table
                                    * Creates a new table if table doesn't exist, otherwise just inserts a new row
                                    * id, createdAt, and updatedAt are set by default; DO NOT ADD
                                    !!!!
                                        Keep force set to false otherwise it will overwrite the table instead of making a new row!
                                    !!!!
                                    */
                                    Models.emojirole.sync({ force: false }).then(() => {

                                        // Loop through the roles array
                                        roleEmojiArr.forEach((item) => {

                                            // Create a new row for each role
                                            Models.emojirole.create({
                                                channel_id: channelId,
                                                post_id: "temp",
                                                role_id: item.role_id,
                                                emoji: item.emoji,
                                            }).then((dbItem) =>{
                                                // Add the item of each new row to the dbItems array
                                                dbItems.push(dbItem.id);
                                            })
                                        })
                                    })

                                    // Create the Embed
                                    let emojiRoleEmbed = new Discord.MessageEmbed()
                                        .setColor(`#551CFF`) //purple
                                        .setTitle(`Joinable Roles`)
                                        .setDescription(`Below are all of the roles that are currently joinable. Simply click on the corresponding reaction/emoji to join the role.\nAlternatively, you can click on it again to leave the role.\n\n*Note: If joined a role via the command, you can simply click on the emoji to add yourself to it and then click again to leave the role.*`)

                                    // Loop through each item in the roleEmojiArr
                                    roleEmojiArr.forEach((item) => {
                                        // Get the role object
                                        const role = message.guild.roles.cache.get(item.role_id);
                                        // Add a new field with the role and emoji
                                        emojiRoleEmbed.addField(`\u200B`, `**${role} - ${item.emoji}**`, false);
                                    });


                                    // Post the message
                                    channel.send({embeds:[emojiRoleEmbed]}).then((postedMsg) => {
                                        // Loop through the roleEmojiArr
                                        roleEmojiArr.forEach((reaction) => {
                                            // Add each reation to the message
                                            postedMsg.react(`${reaction.emoji}`);

                                            // Add the post id to each role added to the db; making sure all the data matches
                                            Models.emojirole.update({post_id: postedMsg.id}, {where: {channel_id: channelId, role_id: reaction.role_id, emoji: reaction.emoji}});
                                        });
                                    })
                                }
                            // If the user goes idle for 5 mins let them know they timed out
                            }).catch(e => {
                                message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                            });
                        })
                    }
                })
            }
        }

        // Function to add a role to the post to be joinable via reaction role post
        async function addRole() {

            // Find the fintPost function to get the post back
            let post = await findPost();

        }

        // Function to remove a role from the post to become unjoinable via reaction role post
        async function removeRole() {

            // Find the fintPost function to get the post back
            let post = findPost();

        }  
        
        // Function to find the emojiRole post
        async function findPost() {
            let channelId, postId, validPost;

            const channelFilter = m => {
                // Ensure the user replied with ONLY a channel mention
                if(m.author.id === message.author.id && m.content.match(/(^<#[0-9]+>$)/)) {
                    return true;
                // If the response wasn't just a channel mention let them know.
                } else if(m.author.id === message.author.id) {
                    message.reply(`Uh oh! It seems that you didn't provide me with a channel to post to.\nPlease tag the channel you wish to post this announcement to.\nMake sure you are **only** replying with the channel object (\`\`#channel\`\`)!`)
                }
            }

            // Ask the user for the channel the post is in
            channelId = await message.reply(`Which channel would you like this announcement to be posted to?\nPlease be sure to tag it using \`\`#channel-name\`\`!`).then(() => {
                // Listen for the response (30 sec wait) and return it
                return message.channel.awaitMessages({filter: channelFilter, max: 1, time: 30000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {
                        // Return just the channel id from the channel object
                        return res.first().content.replace(/[<#>]/g, ``)
                    }
                // If the user goes idle for 30 seconds let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

            // Get the channel
            const channel = message.guild.channels.cache.get(channelId);

            const postIdFilter = async (m) => {
                // Ensure the reply is from the same user
                if(m.author.id === message.author.id) {

                    // Make sure the user only provided a numeric value
                    if(!isNaN(m.content)) {

                        // Attempt to find the post
                        try {
                            const post = await channel.messages.fetch(m.content);

                            // Return true if the post is found
                            if(post !== undefined) {
                                return true;
                            }

                        // If the post wasn't found let the user know
                        } catch(e) {
                            message.reply(`Uh oh! I wasn't able to find a message with that id, please try again!`)
                        }
                    }
                // If the response wasn't numeric, let them know
                } else if(m.author.id === message.author.id) {
                    message.reply(`Uh oh! It seems that you provided me with an invalid post id!`);
                }
            }

            // Ask the user for the post id
            postId = await message.reply(`What is the id of the post within ${channel}?`).then(() => {
                // Listen for the response (30 sec wait) and return it
                return message.channel.awaitMessages({filter: postIdFilter, max: 1, time: 30000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {
                        // Return the post id provided
                        return res.first().content;
                    }
                // If the user goes idle for 30 seconds let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

            // Find the emojirole post
            const post = await channel.messages.fetch(postId);

            // Make sure the post id is within the db
            validPost = await Models.emojirole.findOne({where:{post_id:postId}, raw:true}).then((post) => {
                // If a post was found, return true
                if(post) {
                    return true;
                }
            });

            // If the user provided info is valid, return the message object
            if(validPost === true) {
                return post;
            }
        }
    }
}