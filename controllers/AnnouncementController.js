// Import required files
const moment = require("moment");
const Models = require("../models/AllModels");
const Discord = require('discord.js');

// Suppress the deprecation warnings from moment
moment.suppressDeprecationWarnings = true;

module.exports = {
    crudHandler: async function(message, args, client) {
        const subcommands = ['create', 'edit', 'remove', 'view']; //subcommands var
        const prefix = client.settings.get("prefix");
        // Check if an accepted subcommand was used
        if(!subcommands.includes(args[0].toLowerCase())) {
            // If not an accepted subcommand let the user know
            message.reply(`Uh oh! You seem to have provided me with an invalid subcommand.\nPlease tell me which subcommand you wish to run from the following options: **create**, **view**, **edit**, **delete**!`)
        } else {
            // Run the proper function based on the subcommand given
            switch(args[0].toLowerCase()) {
                case "create":
                    createAnnounce();
                    break;
                case "view":
                    viewAnnounce();
                    break;
                case "edit":
                    editAnnounce();
                    break;
                case "delete":
                    deleteAnnounce();
                    break;
                default:
                    break;
            }
        }

        // Function to handle creating an announcement
        async function createAnnounce() {

            // Create the announcement object
            let announcement = {
                title: null,
                body: null,
                author: null,
                show_author: null,
                channel: null,
                scheduled_date: null,
                poll: null,
                reactions: null,
            };

            // Create a filter to ensure the response is from the same person that used the command
            const authorFilter = m => {
                if(m.author.id === message.author.id) {
                    return true;
                }
            };

            const yesNoFilter = m => {
                // If user says "yes" or "no" then return true
                if(m.author.id === message.author.id && (m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no")) {
                    return true;
                }
            }

            const channelFilter = m => {
                // Ensure the user replied with ONLY a channel mention
                if(m.author.id === message.author.id && m.content.match(/(^<#[0-9]+>$)/)) {
                    return true;
                // If the response wasn't just a channel mention let them know.
                } else if(m.author.id === message.author.id) {
                    message.reply(`Uh oh! It seems that you didn't provide me with a channel to post to.\nPlease tag the channel you wish to post this announcement to.\nMake sure you are **only** replying with the channel object (\`\`#channel\`\`)!`)
                }
            }

            const dateFilter = m => {

                // Ignore if message was from a bot
                if(m.author.bot) return;
                
                let date, validDate; //vars

                try {
                    date = moment(new Date(m.content)).format("YYYY-MM-DDTHH:mm:ss.SSSZZ", true);
                    validDate = moment(date).isValid();
                } catch(e) {
                    console.log(e)
                }
                // Ensure the user replied with the accepted date format
                if(m.author.id === message.author.id && validDate === true) {
                    return true;
                // If the response wasn't valid, let them know.
                } else if(m.author.id === message.author.id) {
                    message.reply(`Uh oh! You didn't use the proper date format, please provide a proper date format and be sure to use UTC to ensure the post date is accurate!\n**Note: Only valid ISO 8601 or RFC 2822 formats are accepted!**`)
                }
            }

            const reactionFilter = m => {
                // Make sure the author is the same as the command user then continue when the user types "done"
                if(m.author.id === message.author.id && m.content.toLowerCase() === "done") {
                    return true;
                }
            }

            /*
            ###########################################
            ################## TITLE ##################
            ###########################################
            */
            // Ask the user for the title of the announcement then assign the resolved promise's value to the title of the announcement
            announcement.title = await message.reply(`Please tell me the title of this announcement.`).then(() => {
                // Listen for the response (30 second wait) and return it
                return message.channel.awaitMessages({filter: authorFilter, max: 1,  time: 30000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {
                        // return the content of the first (and only) response
                    return res.first().content;
                    }
                // If the user goes idle for 10 seconds let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`);
                });
            })

            // If no response then don't proceed
            if(announcement.title === undefined) {
                return;
            }

            /*
            ##########################################
            ################## BODY ##################
            ##########################################
            */
            // Ask the user for the body of the announcement then assign the resolved promise's value to the body of the announcement
            announcement.body = await message.reply(`Please tell me the body of this announcement.\nTo learn to create a hyperlink please run \`\`${prefix}help announce\`\``).then(() => {
                // Listen for the response (5 min wait) and return it
                return message.channel.awaitMessages({filter: authorFilter, max: 1,  time: 300000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {
                        // return the content of the first (and only) response
                    return res.first().content;
                    }
                // If the user goes idle for 10 seconds let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!\nIf you need extra time, write out the announcement before running the command again.`)
                });
            })

            // If no response then don't proceed
            if(announcement.body === undefined) {
                return;
            }

            /*
            ###########################################
            ############### SHOW AUTHOR ###############
            ###########################################
            */
            // Ask the user if they want to be the auther of the announcement or not then assign the resolved promise's value to the show_author of the announcement
            announcement.show_author = await message.reply(`Do you want to show yourself as the author of the post instead of the bot?\n*Note: The bot will still be the poster and owner of the message.*`).then(() => {
                // Listen for the response (30 sec wait) and return it
                return message.channel.awaitMessages({filter: yesNoFilter, max: 1,  time: 30000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {
                        const answer = res.first().content;
                        
                        if(answer.toLowerCase() === "no") {
                            return false;
                        } else if (answer.toLowerCase() === "yes") {
                            return true;
                        }
                    }
                // If the user goes idle for 10 seconds let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

            // If no response then don't proceed
            if(announcement.show_author === undefined) {
                return;
            }

            /*
            #######################################
            ############### CHANNEL ###############
            #######################################
            */
            // Ask the user for the channel the announcement should be posted to then assign the resolved promise's value to the channel of the announcement
            announcement.channel = await message.reply(`Which channel would you like this announcement to be posted to?\nPlease be sure to tag it using \`\`#channel-name\`\`!`).then(() => {
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

            // If no response then don't proceed
            if(announcement.channel === undefined) {
                return;
            }

            /*
            ###########################################
            ############## SCHEDULE DATE ##############
            ###########################################
            */
            // Ask the user for the channel the announcement should be posted to then assign the resolved promise's value to the channel of the announcement
            announcement.scheduled_date = await message.reply(`When would you like this announcement to be posted?\n**Please use a valid ISO 8601 or RFC 2822 date time format and use your own timezone as this will be converted to UTC for you automatically!**`).then(() => {
                // Listen for the response (5 min wait) and return it
                return message.channel.awaitMessages({filter: dateFilter, max: 1, time: 300000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {

                        // Format the string to match the other datetime format in the database
                        let date = moment(res.first().content).format(`YYYY-MM-DD HH:mm:ss`);
                        return date;
                    }
                // If the user goes idle for 5 mins let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

            // If no response then don't proceed
            if(announcement.scheduled_date === undefined) {
                return;
            }

            /*
            #######################################
            ############## REACTIONS ##############
            #######################################
            */
            // Ask the user for the channel the announcement should be posted to then assign the resolved promise's value to the channel of the announcement
            announcement.reactions = await message.reply(`If you'd like to attach any reactions to this announcement, react to this message in the order you want them to appear, if not or when finished type \`\`done\`\`.`).then((botMsg) => {
                // Listen for the response (5 min wait) and return it
                return message.channel.awaitMessages({filter: reactionFilter, max: 1, time: 300000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {

                        // Check if a user added any reactions
                        if(botMsg.reactions.cache.size > 0) {
                            let emojis;
                            // Get each emoji from the message and assign to the var above
                            emojis = botMsg.reactions.cache.map(e => e.emoji.toString());
                            return emojis.join(","); //join the emojis array
                        } else {
                            // If no reactions then return null
                            return null;
                        }
                    }
                // If the user goes idle for 5 mins let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

            // If no response then don't proceed
            if(announcement.reactions === undefined) {
                return;
            }

            /*
            ####################################
            ############### POLL ###############
            ####################################
            */
            // Ask the user if they want to be the auther of the announcement or not then assign the resolved promise's value to the poll of the announcement
            announcement.poll = await message.reply(`Is this announcement going to be used as a poll?`).then(() => {
                // Listen for the response (30 sec wait) and return it
                return message.channel.awaitMessages({filter: yesNoFilter, max: 1,  time: 30000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {
                        const answer = res.first().content;
                        
                        if(answer.toLowerCase() === "no") {
                            return false;
                        } else if (answer.toLowerCase() === "yes") {
                            return true;
                        }
                    }
                // If the user goes idle for 10 seconds let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

            // If no response then don't proceed
            if(announcement.poll === undefined) {
                return;
            }

            announcement.author = message.author.id;
            const postChannel = await message.guild.channels.fetch(announcement.channel);
            let poll;
            let announcementType;

            // Set type and poll based on whether the announcement is a poll or not
            if(announcement.poll === true) { 
                poll = "Yes"; 
                announcementType = "poll";
            } else { 
                poll = "No";
                announcementType = "announcement";
            }

            // Create the announcement embed
            let announceEmbed = new Discord.MessageEmbed()
                .setColor(`#551CFF`)
                .setTitle(announcement.title)
                .setDescription(announcement.body)
                .addField("Post Date", `${Discord.Formatters.time(new Date(announcement.scheduled_date), "f")} (${Discord.Formatters.time(new Date(announcement.scheduled_date), "R")})`, false)
                .addField("Channel", `${postChannel}`, true)
                .addField("Poll", `${poll}`, true)
                .setTimestamp(new Date());


                // If the user wanted to be the author set it to their display name and avatar
                if(announcement.show_author === true) {
                    announceEmbed.setAuthor(message.member.displayName, message.member.displayAvatarURL({dynamic:true}));

                // If the user didn't want to be the author set to the bot's display name and avatar
                } else {
                    announceEmbed.setAuthor(message.guild.me.displayName, message.guild.me.displayAvatarURL({dynamic:true}));
                }

            // Send the announceEmbed to the user for them to validate it
            message.reply({content: `Here is your ${announcementType}, is this correct?`, embeds: [announceEmbed]}).then((announceMsg) =>{

                // If reactions were given
                if(announcement.reactions) {
                    // Attempt to react to announceMsg
                    try {
                        // Convert the reactions string to an array
                        const reactionArr = announcement.reactions.split(",");

                        // Loop through the array and react with the reactions in order given
                        reactionArr.forEach(async (reaction) => {
                            await announceMsg.react(reaction)
                        })
                    // Catch and log any errors
                    } catch(e) {
                        console.error(`One of the emojis from the ${announcementType} builder failed to react!`, e)
                    }
                }

                // Listen for the user's response (30 seconds)
                message.channel.awaitMessages({filter: yesNoFilter, max: 1,  time: 30000, errors:["time"]}).then(res => {
                    // Make sure the res is valid
                    if(res) {
                        // If the user confirms it is correct add it to the DB
                        if(res.first().content === "yes") {

                            // If no reactions were given then set to null
                            if(announcement.reactions === "none") {
                                announcement.reactions = null;
                            }
                            
                            /* 
                            * Sync the model to the table
                            * Creates a new table if table doesn't exist, otherwise just inserts a new row
                            * id, createdAt, and updatedAt are set by default; DO NOT ADD
                            !!!!
                                Keep force set to false otherwise it will overwrite the table instead of making a new row!
                            !!!!
                            */
                            Models.announcement.sync({ force: false }).then(() => {
                                Models.announcement.create({
                                    title: announcement.title,
                                    body: announcement.body,
                                    author: announcement.author,
                                    server: message.guildId,
                                    show_author: announcement.show_author,
                                    channel: announcement.channel,
                                    post_at: announcement.scheduled_date,
                                    reactions: announcement.reactions,
                                    poll: announcement.poll
                                }).then((data) => {
                                    message.reply(`Your ${announcementType} was successfully created!\n**${announcementType} id: **\`\`${data.id}\`\``);
                                })
                            })

                        // If the user confirms it is incorrect, ask them to redo the command
                        } else {
                            return res.first().reply(`Uh oh! I have not saved this announcement! Please use the command again and fix whatever it was that was incorrect.`)
                        }
                    }
                })
            })
        }

        // Function to handle viewing an announcement
        async function viewAnnounce() {
            let user = null;
            let announcement = null;

            // Ensure 3 args were given; "view", author or id, and the user/user id or announcement id
            if(args.length === 3) {
                // If the user is searching by author
                if(args[1].toLowerCase() === "author" || args[1].toLowerCase() === "a" || args[1].toLowerCase() === "creator" || args[1].toLowerCase() === "c") {
                    // Check for user by id
                    if(!isNaN(args[2])) {
                        // If invalid id let the user know
                        if(message.guild.members.cache.get(args[2]) === undefined) {
                            return message.reply(`Uh oh! Looks like I wasn't able to find that user, please check the user id and try again or try using a user mention like so: \`@Username\``);

                        // If user found, assign it to the user var
                        } else {
                            user = message.guild.members.cache.get(args[2]);
                        }
                    // Check if a user mention was given
                    } else if (args[2].startsWith("<@")) {
                        user = message.mentions.members.first(); // get user
                        if(!user) {
                            // Let the user know they provided an invalid user mention
                            return message.reply(`Uh oh! Looks like you gave an invalid user mention. Make sure that you are mentioning a valid user!`);
                        }
                    } else {
                        // Let user know they need to provide a user mention or a valid user id
                        return message.reply(`Uh oh! You must provide me with a user mention or id so I know the announcement(s) to look for!`);
                    }
                // If the user is searching by announcement id
                } else if (args[1].toLowerCase() === "id" || args[1].toLowerCase() === "i") {
                    // If the user provided a valid id
                    if(!isNaN(args[2])) {
                        //
                        await Models.announcement.findOne({where: {id:args[2]}, raw:true}).then((announce) => {
                            // Make sure an announcement was found
                            if(announce) {
                                announcement = announce;
                            } else {
                                return message.reply(`Uh oh! It seems there is no announcement with that id! Please try again.`)
                            }
                        });
                    
                    // If the user provided an invalid id let them know
                    } else {
                        message.reply(`Uh oh! You provided me with an invalid id, please make sure you are using numeric characters only!`);
                    }
                // If the user gave 3 args but they weren't recognized as being valid
                } else {
                    return message.reply(`Uh oh! It looks like you didn't use the command properly, please refer to \`\`${prefix}help announce\`\` for more info!`);
                }

                // Check if there is a user or announcement that was found
                if(user || announcement) {
                    // If a user was found, then get the user's announcements
                    if(user) {

                        // Find all of the announcements by the user given
                        Models.announcement.findAll({where: {author: user.user.id}, order:[["createdAt", "DESC"]], raw:true}).then(async (announcements) => {
                            // Ensure announcements were found
                            if(announcements.length) {
                                const postChannel = await message.guild.channels.fetch(announcements[0].channel);
                                let poll; //poll string var

                                // Set the poll bool to be more reader friendly
                                if(announcements[0].poll === 1) {
                                    poll = "True";
                                } else {
                                    poll = "False";
                                }

                                // Create the announcement embed
                                let announceEmbed = new Discord.MessageEmbed()
                                    .setColor(`#551CFF`)
                                    .setTitle(`${user.displayName}'s Announcements`)
                                    .setDescription(`Newest announcement **(ID: \`\`${announcements[0].id}\`\`)**:\n*${announcements[0].title}*`)
                                    .addField("Created", `${Discord.Formatters.time(announcements[0].createdAt, "f")} (${Discord.Formatters.time(announcements[0].createdAt, "R")})`)
                                    .addField("Post Date", `${Discord.Formatters.time(announcements[0].post_at, "f")} (${Discord.Formatters.time(announcements[0].post_at, "R")})`, false)
                                    .addField("Channel", `${postChannel}`, true)
                                    .addField("Poll", `${poll}`, true)

                                // If there is more than 1 announcement by this user append the ids of the other announcements
                                if(announcements.length > 1) {
                                    let announcementIds = []; //id array

                                    // Add each announcments' id to the array
                                    announcements.forEach((announcement) => {
                                        // Make sure the current iteration isn't the same as the first announcement
                                        if(announcement.id !== announcements[0].id) {
                                            // Add the id to the id array
                                            announcementIds.push(`\`\`${announcement.id}\`\``)
                                        // If iteration is the same as the first announcement then skip it
                                        } else {
                                            return;
                                        }
                                    })

                                    // Add the ids field to the embed
                                    announceEmbed.addField("Other Announcements' Ids", `${announcementIds.toString()}`, false)
                                }

                                // Send the announcement embed
                                message.channel.send({embeds: [announceEmbed]});
                            // If the author wasn't found in the db let the user know
                            } else {
                                return message.reply(`It seems that the user you provided hasn't created any announcements!`)
                            }
                        })

                    // If an announcement was found then get the announcement
                    } else if (announcement) {

                        // Find the announcement in the db
                        Models.announcement.findOne({where: {id: announcement.id}, raw: true}).then(async (data) => {
                            // Ensure the announcement was found
                            if(data) {
                                const postChannel = await message.guild.channels.fetch(announcement.channel);
                                let poll, showAuthor; //poll string var
                                const author = message.guild.members.cache.get(announcement.author);

                                // Set the poll bool to be more reader friendly
                                if(announcement.poll === 1) {
                                    poll = "True";
                                } else {
                                    poll = "False";
                                }

                                // Set the showAuthor bool to be more reader friendly
                                if(announcement.show_author === 1) {
                                    showAuthor = "True";
                                } else {
                                    showAuthor = "False";
                                }

                                // If no reactions for the announcement set the N/A
                                if(announcement.reactions === null) {
                                    announcement.reactions = "N/A";
                                }

                                // Create the announcement embed
                                let announceEmbed = new Discord.MessageEmbed()
                                    .setColor(`#551CFF`)
                                    .setTitle(`${announcement.title}`)
                                    .setDescription(`${announcement.body}`)
                                    .addField("Author", `${author}`, true)
                                    .addField("Channel", `${postChannel}`, true)
                                    .addField("Poll", `${poll}`, true)
                                    .addField(`Show Author`, `${showAuthor}`, true)
                                    .addField(`Reactions`, `${announcement.reactions.replace(/,/g, ` `)}`, true) //replace commas in string with spaces
                                    .addField("Created", `${Discord.Formatters.time(announcement.createdAt, "f")} (${Discord.Formatters.time(announcement.createdAt, "R")})`, false)
                                    .addField("Updated", `${Discord.Formatters.time(announcement.updatedAt, "f")} (${Discord.Formatters.time(announcement.updatedAt, "R")})`, false)
                                    .addField("Post Date", `${Discord.Formatters.time(announcement.post_at, "f")} (${Discord.Formatters.time(announcement.post_at, "R")})`, false)

                                // Send the announcement embed
                                message.channel.send({embeds: [announceEmbed]});
                            }
                        })
                    }
                }
                // Check if the user provided 2 arguments
            } else if(args.length === 2) {
                // Make sure the user provided "recent" as the 2nd arg
                if(args[1].toLowerCase() === "recent") {
                    // Find the 10 most recent announcements
                    Models.announcement.findAll({order:[['createdAt', 'DESC']],limit:10,raw:true}).then((announcements) => {
                        // Ensure announcements were found
                        if(announcements.length) {
                            // Create the embed
                            let announceEmbed = new Discord.MessageEmbed()
                                .setColor(`#551CFF`)
                                .setTitle(`10 Most Recent Announcements/Polls Created`)
                                .setDescription(`To see more detailed information about an announcement, view that specific announcement via \`${prefix}announcement view id <id>\`!`)
                                .setTimestamp(new Date());

                            // Loop through the announcements
                            announcements.forEach((item) => {
                                let poll; //poll bool var
                                const author = message.guild.members.cache.get(item.author); //get the author

                                // Set the poll bool to be more reader friendly
                                if(item.poll === 1) {
                                    poll = "True";
                                } else {
                                    poll = "False";
                                }

                                // Add the data to a new field in the embed
                                announceEmbed.addField(`Id: ${item.id} - ${item.title}`, `Author: ${author}\nCreated: ${Discord.Formatters.time(item.createdAt, "f")} (${Discord.Formatters.time(item.createdAt, "R")})\nPost Date: ${Discord.Formatters.time(item.post_at, "f")} (${Discord.Formatters.time(item.post_at, "R")})\nPoll: ${poll}`)
                            })

                            // Send the embed
                            message.channel.send({embeds:[announceEmbed]});
                        // If no announcements were found let the user know
                        } else {
                            message.reply(`It seems there are no announcements currently!`)
                        }
                    })

                // If the user didn't provide a valid input format, let them know
                } else {
                    return message.reply(`Uh oh! It looks like you didn't use the command properly, please refer to \`\`${prefix}help announce\`\` for more info!`);
                }
            } else {
                // Let the user know that they must provide 
                return message.reply(`Uh oh! It seems that you didn't tell me how you are searching for the announcement. Please let me know if you are searching by the author, the announcement id, or recent announcements!\nExamples: \n\`\`${prefix}announce view author @${message.member.displayName}\`\`\n\`\`${prefix}announce view author ${message.author.id}\`\`\n\`\`${prefix}announce view id 123\`\``)
            }
        }

        // Function to handle editing an announcement
        function editAnnounce() {
            
        }

        // Function to handle deleting an announcement
        function deleteAnnounce() {
            // Ensure the user provided at least 2 args
            if(args.length > 1) {
                // Ensure the id is a numeric value
                if(!isNaN(args[1])) {

                // Search for the announcement in the db
                Models.announcement.findOne({where: {id:args[1]}, raw:true}).then(async (item) => {
                    // Ensure data was found
                    if(item) {

                        // Create a filter for the confirmation question
                        const yesNoFilter = m => {
                            // If user says "yes" or "no" then return true
                            if(m.author.id === message.author.id && (m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no")) {
                                return true;
                            }
                        }

                        const postChannel = await message.guild.channels.fetch(item.channel);
                        let poll, showAuthor; //poll string var
                        const author = message.guild.members.cache.get(item.author);

                        // Set the poll bool to be more reader friendly
                        if(item.poll === 1) {
                            poll = "True";
                        } else {
                            poll = "False";
                        }

                        // Set the showAuthor bool to be more reader friendly
                        if(item.show_author === 1) {
                            showAuthor = "True";
                        } else {
                            showAuthor = "False";
                        }

                        let reactions;
                        
                        if(item.reactions) {
                            reactions = item.reactions.replace(/,/g, ` `);
                        } else {
                            reactions = "None";
                        }

                        // Create the announcement embed
                        let announceEmbed = new Discord.MessageEmbed()
                            .setColor(`#551CFF`)
                            .setTitle(`${item.title}`)
                            .setDescription(`${item.body}`)
                            .addField("Author", `${author}`, true)
                            .addField("Channel", `${postChannel}`, true)
                            .addField("Poll", `${poll}`, true)
                            .addField(`Show Author`, `${showAuthor}`, true)
                            .addField(`Reactions`, `${reactions}`, true) //replace commas in string with spaces
                            .addField("Created", `${Discord.Formatters.time(item.createdAt, "f")} (${Discord.Formatters.time(item.createdAt, "R")})`, false)
                            .addField("Updated", `${Discord.Formatters.time(item.updatedAt, "f")} (${Discord.Formatters.time(item.updatedAt, "R")})`, false)
                            .addField("Post Date", `${Discord.Formatters.time(item.post_at, "f")} (${Discord.Formatters.time(item.post_at, "R")})`, false)


                        // Show the user the announcement and verify that they wish to delete it
                        message.reply({content: `Here is your announcement, are you sure you wish to delete it?\n**IMPORTANT: THIS CANNOT BE UNDONE!**`, embeds: [announceEmbed]}).then(() => {
                            // Listen for the response (30 sec wait) and return it
                            return message.channel.awaitMessages({filter: yesNoFilter, max: 1,  time: 30000, errors:["time"]}).then(res => {
                                // Make sure res is valid
                                if(res) {
                                    const answer = res.first().content; //response
                                    // If the user deicded not to delete the announcement let them know it was canceled
                                    if(answer.toLowerCase() === "no") {
                                        return message.reply(`Okay! I have not removed this announcement!`);

                                    // If the user still wants to proceed with deleting the announcement
                                    } else if (answer.toLowerCase() === "yes") {

                                        // Delete the announcement from the db
                                        Models.announcement.destroy({
                                            where: {
                                                id: item.id
                                            }
                                        // Let the user know it was removed
                                        }).then(() => {
                                            message.reply(`I have successfully removed the above announcement!`);
                                        });
                                    }
                                }
                            // If the user goes idle for 30 seconds let them know they timed out
                            }).catch(e => {
                                message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                            });
                        })

                    // If no announcement was found let the user know
                    } else {
                        return message.reply(`Uh oh! It seems there is no announcement in the database with that id, please try again or use the view subcommand of the announcement command to find the announcement!`)
                    }
                })

                // If the id isn't a numeric value let the user know
                } else {
                    return message.reply(`Uh oh! It seems that you provided me with an invalid id type. Ids are numeric only, please try again or use the view subcommand of the announcement command to find the id.`)
                }
            // If not enough args were provided let the user know
            } else {
                return message.reply(`Uh oh! It seems that you didn't provide me with the id of the announcement you wish to delete. Please use the view subcommend of announcement if you aren't sure of the id.`);
            }
        }
    },
}