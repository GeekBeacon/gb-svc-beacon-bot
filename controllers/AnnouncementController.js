// Import required files
const moment = require("moment");
const Models = require("../models/AllModels");
const Discord = require('discord.js');

// Suppress the deprecation warnings from moment
moment.suppressDeprecationWarnings = true;

module.exports = {
    crudHandler: async function(message, args, client) {
        const subcommands = ['create', 'view', 'edit', 'delete']; //subcommands var
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
            let announcement = {
                title: null,
                body: null,
                author: null,
                show_author: null,
                channel: null,
                scheduled_date: null,
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
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

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

            /*
            ###########################################
            ############## SCHEDULE DATE ##############
            ###########################################
            */
            // Ask the user for the channel the announcement should be posted to then assign the resolved promise's value to the channel of the announcement
            announcement.scheduled_date = await message.reply(`When would you like this announcement to be posted?\n**Please use UTC times only and a valid ISO 8601 or RFC 2822 date time format!**`).then(() => {
                // Listen for the response (30 sec wait) and return it
                return message.channel.awaitMessages({filter: dateFilter, max: 1, time: 60000, errors:["time"]}).then(res => {
                    // Make sure res is valid
                    if(res) {

                        // Format the string to match the other datetime format in the database
                        let date = moment(res.first().content).format(`YYYY-MM-DD HH:mm:ss`);
                        return date;
                    }
                // If the user goes idle for 30 seconds let them know they timed out
                }).catch(e => {
                    message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                });
            })

            console.log(announcement)
        }

        // Function to handle viewing an announcement
        function viewAnnounce() {
            
        }

        // Function to handle editing an announcement
        function editAnnounce() {
            
        }

        // Function to handle deleting an announcement
        function deleteAnnounce() {
            
        }

    },
}