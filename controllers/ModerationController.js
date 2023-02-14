const moment = require("moment");
const Models = require("../models/AllModels");
const shortid = require('shortid');
const Discord = require('discord.js');
const pagination = require(`discord.js-pagination`);

module.exports = {
    deleteHandler: function(m, c, tl, deleteSet) {
        const message = m, client = c, triggerList = tl;
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        const superLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_log_channel_name")))); //super log channel
        let triggerArr = [];

        // If deleted due to an unapproved url then ignore
        if(deleteSet.has(message.id)) {
            // Remove the message id from the set then ignore with return
            deleteSet.delete(message.id)
            return;
        }

        // Add the trigger words/phrases to the local array
        for(key in triggerList.list) {
            triggerArr.push(key);
        }

        // See if the message contains a trigger
        if(triggerArr.some(trigger => message.content.toLowerCase().match(`\\b${trigger}\\b`))) {
            // Store the trigger words
            let triggers = triggerArr.filter((trig) => message.content.toLowerCase().match(`\\b(${trig})\\b`));

            // Loop through all triggers in the message
            triggers.forEach((trigg) => {

                // If the trigger is high severity then return (don't send embed)
                if(triggerList.list[trigg] === "high") {
                    return;
                }
            })
            
        } else {
            // Create the delete embed
            const delEmbed = {
                color: 0x33ccff,
                title: `Message Deleted in ${message.channel.name}`,
                author: {
                    name: `${message.author.username}#${message.author.discriminator}`,
                    icon_url: message.author.displayAvatarURL({dynamic:true})
                },
                description: `A message by ${message.author} was deleted in ${message.channel}`,
                fields: [
                    {
                        name: "Message",
                        value: message.content || "`{Message was either an Embed or Image}`",
                        inline: false,
                    }
                ],
                timestamp: new Date()
            }

            // Send to master control logs
            if(message.channel.name.includes("master-control") || message.channel.name.includes("employees")) {
                superLog.send({embeds: [delEmbed]});
            } else {
                // Send the embed to the action log channel
                actionLog.send({embeds: [delEmbed]});
            }

            /* POINT REMOVAL */
            const thxRegex = /\b(thanks*|thx*|ty*|thank\s*you*)\b/
            // Check if the message was a reply
            if(message.reference) {
                // Make sure the post is from the same guild (not an automated message when following channels in other servers)
                if(message.reference.guildId === message.guildId) {
                    // Get the data about the reference
                    message.fetchReference().then((reference) => {
                        // Ensure the message isn't a system message about a message being pinned
                        if(reference.pinned === false) {
                            if(message.author.id !== reference.author.id) {
                                // Check if the user said thanks within their reply
                                if(message.content.toLowerCase().match(thxRegex)) {

                                    // Call the addToDB function to update or create the user with 3 point value
                                    removeFromDB(reference.author.id, 3);
                                }
                            }
                        }
                    })
                }
            } else {
                // Call the addToDB function to update or create the user with 1 point value
                removeFromDB(message.author.id, 1);
            }

            function removeFromDB(uid, pval) {
                /* 
                * Sync the model to the table
                * Creates a new table if table doesn't exist, otherwise just inserts a new row
                * id, createdAt, and updatedAt are set by default; DO NOT ADD
                !!!!
                    Keep force set to false otherwise it will overwrite the table instead of making a new row!
                !!!!
                */
                Models.user.sync({force: false}).then(() => {
                    // Check if the user is in the db already
                    Models.user.findOne({where: {user_id: uid}, raw: true}).then((user) => {

                        // If the user is in the db
                        if(user) {

                            // Remove points to the existing points value
                            let pointsVal = user.points - pval;
                            let level = 0;

                            // Determine the user's level
                            switch(pointsVal) {
                                case pointsVal >= 1000:
                                    level = 5;
                                    break;
                                case pointsVal >= 500:
                                    level = 4;
                                    break;
                                case pointsVal >= 100:
                                    level = 3;
                                    break;
                                case pointsVal >= 50:
                                    level = 2;
                                    break;
                                default:
                                    level = 1;
                                    break;
                            };

                            // Update the user's points and level
                            Models.user.update({points: pointsVal, level: level}, {where: {user_id: uid}});
                        }
                    })
                })
            }
        }
    },
    purgeHandler: function(interaction) {
        const superLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("super_log_channel_name")))); //super log channel
        const count = interaction.options.getInteger(`amount`); //get the number of messages to delete
        const channel = interaction.options.getChannel(`channel`); //get the channel the user requested to purge

            // If a channel was provided
            if(channel) {
                purgeMessages(channel);
            // If no channel was provided
            } else {
                purgeMessages(interaction.channel);
            }

            // Create a function to handle purging the messages
            function purgeMessages(c) {
                // Perform the bulk delete !! Set true to ignore messages older than 2 weeks to prevent errors !!
                c.bulkDelete(count, true).then((messages) => {
                    bulkEmbed = {
                        color: 0xFF5500,
                        title: "Bulk Deleted Messages",
                        author: {
                            name: `${interaction.user.username}#${interaction.user.discriminator}`,
                            icon_url: interaction.member.displayAvatarURL({dynamic:true}),
                        },
                        description: `${messages.size} messages were deleted in ${c}`,
                        fields: [
                            {
                                name: "Count Given",
                                value: `${count}`,
                                inline: true,
                            },
                            {
                                name: "Channel",
                                value: `${interaction.channel}`,
                                inline: true,
                            },
                            {
                                name: "Performed By",
                                value: `${interaction.member}`,
                                inline: true,
                            }
                        ],
                        timestamp: new Date(),
                    };

                    // Send the embed to the super log channel
                    superLog.send({embeds: [bulkEmbed]});

                    // If the requested amount of messages were deleted
                    if(messages.size === count) {
                        // Let the user know the messages were deleted
                        interaction.reply({content: `I have successfully deleted the last ${count} messages within the ${c} channel!`, ephemeral: true});
                    // If older messages weren't able to be deleted
                    } else {
                        // Let the user know how many messages were deleted
                        interaction.reply({content: `It seems I was only able to delete ${messages.size} of the requested ${count} messages within the ${c} channel!\n\n**Note: Messages older than 14 days cannot be bulk deleted.**`, ephemeral: true});
                    }
                });
            }

    },
    editHandler: function(o, n, c, tl, bu, deleteSet) {
        const oldMsg = o, newMsg = n, client = c, triggerList = tl, bannedUrls = bu; // create vars for parameter values
        const superLog = newMsg.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_log_channel_name")))); //super log channel
        const modLog = newMsg.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        // Create author var
        const author = client.users.cache.get(newMsg.author.id);
        let bannedUrlArr = [];

        // Create embed and attach the shared fields
        let editEmbed = new Discord.MessageEmbed()
        .setColor(0x00ff00)
        .setTimestamp();

        // If pinned message then ignore
        if(oldMsg.pinned !== newMsg.pinned) {
            return;
        // If the message contains an embed
        } else if(newMsg.embeds.length) {
            // If the content (not embed) of the message is the same then ignore
            if(oldMsg.content === newMsg.content) {
                return;
            } else {
                // Add the editEmbed data
                editEmbed.setTitle(`Message was edited in ${newMsg.channel.name}`)
                .setAuthor(`${author.username}#${author.discriminator}`, author.displayAvatarURL({dynamic:true}))
                .setDescription(`${newMsg.author} has edited a message in ${newMsg.channel} | [Jump To Message](${newMsg.url})`)
                .addFields(
                    {
                        name: `Original Message`,
                        value: ` ${oldMsg.content || "*Unable to fetch original message*"}`,
                    },
                    {
                        name: `New Message`,
                        value: ` ${newMsg.content}`,
                    }
                );
            }
        } else {
            // Add the editEmbed data
            editEmbed.setTitle(`Message was edited in ${newMsg.channel.name}`)
            .setAuthor(`${author.username}#${author.discriminator}`, author.displayAvatarURL({dynamic:true}))
            .setDescription(`${newMsg.author} has edited a message in ${newMsg.channel} | [Jump To Message](${newMsg.url})`)
            .addFields(
                {
                    name: `Original Message`,
                    value: ` ${oldMsg.content || "*Unable to fetch original message*"}`,
                },
                {
                    name: `New Message`,
                    value: ` ${newMsg.content}`,
                }

            );
        }
        // If the edit was made in the super channel send to super logs
        if(newMsg.channel.name.includes("master-control") || newMsg.channel.name.includes("employees")) {
            superLog.send({embeds: [editEmbed]});
        } else {
            // Send the edit embed to the mod log channel
            modLog.send({embeds: [editEmbed]}).then(() => {
                // Loop through the bannedUrl list
                bannedUrls.list.forEach((domain) => {
                    // Add each domain to the bannedUrlArr var
                    bannedUrlArr.push(domain);
                });

                if (newMsg.content.toLowerCase().match(/(?!w{1,}\.)(\w+\.?)([a-zA-Z0-9-]+)(\.\w+)/)) {
                    const url_role_whitelist = client.settings.get("url_role_whitelist").split(",");
                    // If user has an excluded role then ignore
                    if(newMsg.member.roles.cache.some(r => url_role_whitelist.includes(r.id))) {
                        return;
                    }

                    // If not blacklisted then ignore
                    if(!newMsg.content.toLowerCase().match(bannedUrlArr.map(domain => `\\b${domain}\\b`).join("|"))) {
                        return;
                        
                    // If blacklisted url then handle it
                    } else {
                        const regexMatch = newMsg.content.toLowerCase().match(/(?!w{1,}\.)(\w+\.?)([a-zA-Z0-9-]+)(\.\w+)/);
                        // If not then call the handleUrl function from the ModerationController file
                        this.handleUrl(newMsg, regexMatch, deleteSet);
                    };
                }
            });
        }
    },
    kickHandler: function(a, m, c) {
        const args = a, message = m, client = c;
        let warnId = shortid.generate(); //generate a short id for the warning
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        let user; // user var
        // Get the mod+ roles
        const modTraineeRole = message.guild.roles.cache.find(role => role.id === client.settings.get("trainee_role_id"));
        const modRole = message.guild.roles.cache.find(role => role.id === client.settings.get("mod_role_id"));
        const superRole = message.guild.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.guild.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));

        // Check if the first arg is a number
        if(isNaN(args[0])) {
            // Attempt to fix the arg for the user by removing the comma if the moderator forgot to add a space after the id and before the comma
            args[0] = args[0].replace(",", "");
        }

        // Make sure the first arg was a user mention or a user id
        if(isNaN(args[0]) && !args[0].startsWith("<@")) {
            // Let user know they need to provide a user mention or a valid user id
            message.reply(`Uh oh! Looks like you gave an invalid user mention or user id. Make sure that you are either mentioning a user or providing a valid user id!`);
        } else {

            // Check if a user mention was given
            if(args[0].startsWith("<@")) {
                user = message.mentions.members.first(); // get user tag
            // If not, find the user by the provided id
            } else {
                // If invalid id let the user know
                if(message.guild.members.cache.get(args[0]) === undefined) {
                    return message.reply(`Uh oh! Looks like I wasn't able to find that user, please check the user id and try again or try using a user mention like so: \`@Username\``);

                // If user found, assign it to the user var
                } else {
                    user = message.guild.members.cache.get(args[0]);
                }
            }

            // If user is a bot then deny kicking it
            if(user.user.bot) {
                return message.channel.send(`You can't kick no beep boop!`);
            // If the user tries to kick themselves then deny kicking them
            } else if(user.user.id === message.author.id) {
                return message.reply(`You can't kick yourself from the server, silly!`);
            // If the user is a mod+ then deny kicking them
            } else if(user.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name))) {
                return message.reply(`You got guts, trying to kick a ${user.roles.highest} member!`);
            // If the user is the server owner then deny kicking them
            } else if (user.user.id === user.guild.ownerID) {
                return message.reply(`I hope you didn't really think you could kick the server owner...`);
            }

            // If a reason was given then kick the user and log the action to the database
            if(args[1]) {
                let reasonArr = args;
                let reason;
                reasonArr.shift(); //remove the first arg (user mention or id)
                reason = reasonArr.join(" "); //turn the array into a string
                reason = reason.replace(',', ''); // remove the first comma from the string
                reason = reason.trim(); // remove any excess whitespace

                /* 
                * Sync the model to the table
                * Creates a new table if table doesn't exist, otherwise just inserts a new row
                * id, createdAt, and updatedAt are set by default; DO NOT ADD
                !!!!
                    Keep force set to false otherwise it will overwrite the table instead of making a new row!
                !!!!
                */
                Models.kick.sync({ force: false }).then(() => {
                    // Add the kick record to the database
                    Models.kick.create({
                        user_id: user.id,
                        reason: reason,
                        moderator_id: message.author.id,
                    })
                    // Let the user know it was added
                    .then(() => {

                        // Create the kicked embed
                        const kickEmbed = {
                            color: 0xFFA500,
                            title: `User Was Kicked!`,
                            author: {
                                name: `${user.user.username}#${user.user.discriminator}`,
                                icon_url: user.user.displayAvatarURL({dynamic:true}),
                            },
                            description: `${user} was kicked from the server by ${message.author}`,
                            fields: [
                                {
                                    name: `User Kicked`,
                                    value: `${user}`,
                                    inline: true,
                                },
                                {
                                    name: `Kicked By`,
                                    value: `${message.author}`,
                                    inline: true,
                                },
                                {
                                    name: `Reason`,
                                    value: `${reason}`,
                                    inline: false,
                                }
                            ],
                            timestamp: new Date(),
                        };

                        /* 
                        * Sync the model to the table
                        * Creates a new table if table doesn't exist, otherwise just inserts a new row
                        * id, createdAt, and updatedAt are set by default; DO NOT ADD
                        !!!!
                            Keep force set to false otherwise it will overwrite the table instead of making a new row!
                        !!!!
                        */
                        Models.warning.sync({ force: false }).then(() => { 
                            // See if the warning id exists already
                            Models.warning.findOne({where: {warning_id: warnId}, raw:true}).then((warning => {
                                // If the warning id matches the newly generated one, generate a new one
                                if(warning) {
                                    warnId = shortid.generate();
                                };
                            })).then(() => { 
                                // Create a new warning
                                Models.warning.create({
                                    warning_id: warnId, // add the warning Id
                                    user_id: user.id, // add the user's id
                                    type: "Kicked", // assign the type of warning
                                    reason: reason, // add the reason for the warning
                                    username: user.user.username, // add the username
                                    mod_id: message.author.id
                                }).then(() => {

                                    // Kick the user from the server
                                    user.kick(reason).then(() => {
                                        // Send the embed to the action log channel
                                        actionLog.send({embeds: [kickEmbed]});
                                        // Let mod know the user has been kicked
                                        message.channel.send(`${user.user.username} was successfully kicked from the server!`)
                                    });
                                });
                            });
                        });
                    })
                });
            } else {
                // Check if a user mention was used
                if(message.mentions.users.first()) {
                    // Let user know a reason is needed
                    message.reply(`Uh oh! It seems you forgot to give a reason for kicking, please be sure to provide a reason for this action!\nExample: \`${prefix}kick @${user.user.tag}, reason\``);

                // If no user mention was given then just output the id they provided
                } else {
                    // Let user know a reason is needed
                    message.reply(`Uh oh! It seems you forgot to give a reason for kicking, please be sure to provide a reason for this action!\nExample: \`${prefix}kick ${user}, reason\``);
                }
            }
        }
    },
    banHandler: async function(a, m, c) {
        const args = a, message = m, client = c;
        let warnId = shortid.generate(); //generate a short id for the warning
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        let user, bans; //vars
        let msgDel = 0; //number of days to clear messages
        let msgCleared = "No"; //bool for cleared messages
        // Get the mod+ roles
        const modTraineeRole = message.guild.roles.cache.find(role => role.id === client.settings.get("trainee_role_id"));
        const modRole = message.guild.roles.cache.find(role => role.id === client.settings.get("mod_role_id"));
        const superRole = message.guild.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.guild.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));

        let argsStr = args.join(" "); //create a string out of the args
        argsStr = argsStr.replace(/,/g, ", "); // replace
        const newArgs = argsStr.split(",").map(i => i.trim()); //create a new args array and trim the whitespace from the items

        // Check if an argument for days of messages to remove was given
        if(newArgs[3]) {
            // Ensure a number was given
            if(isNaN(newArgs[3])) {
                return message.reply(`You must either give me a number (0-7) for the amount of days to clear the user's messages or leave blank.\nExample: \`${prefix}ban @user, Reason, Perma, 7\``)
            } else {
                // Ensure the number is between 0 and 7
                if(newArgs[3] < 0 || newArgs[3] > 7) {
                    return message.reply(`The maximum number of days I can clear messages for is 7, please enter a number between 0 and 7.\`${prefix}ban @user, Reason, Perma, 3\``)
                } else {
                    // If the number is between 0 and 7 assign the value to msgDel and set the msgCleared bool to "Yes"
                    msgDel = newArgs[3];
                    msgCleared = "Yes";
                }
            }
        }

        // Make sure the first arg was a user mention or a user id
        if(isNaN(newArgs[0]) && !newArgs[0].startsWith("<@")) {
            // Let user know they need to provide a user mention or a valid user id
            message.reply(`Uh oh! Looks like you gave an invalid user mention or user id. Make sure that you are either mentioning a user or providing a valid user id!`);
        } else {

            // Check if a user mention was given
            if(newArgs[0].startsWith("<@")) {

                // Try to get the user
                try {
                    user = message.mentions.members.first(); // get user tag
                } catch(e) {
                    // If unable to get the user, let the mod know
                    return message.reply(`Uh oh! That user isn't a member of this guild!`);
                }

                // If user is a bot then deny banning it
                if(user.user.bot) {
                    return message.channel.send(`You can't ban no beep boop!`);
                // If the user tries to ban themselves then deny banning them
                } else if(user.user.id === message.author.id) {
                    return message.reply(`You can't ban yourself from the server, silly!`);
                // If the user is a mod+ then deny banning them
                } else if(user.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name))) {
                    return message.reply(`You got guts, trying to ban a ${user.roles.highest} member!`);
                // If the user is the server owner then deny banning them
                } else if (user.user.id === user.guild.ownerID) {
                    return message.reply(`I hope you didn't really think you could ban the server owner...`);
                }

                // Reassign the user to be a user role and not a guildMember role
                user = user.user;

            // If not, find the user by the provided id
            } else {

                // Try to get the user
                try {
                    user = await client.users.fetch(newArgs[0]);
                } catch(e) {
                    // If unable to get the user, let the mod know
                    return message.reply(`Uh oh! I wasn't able to find that user!`);
                }

                // Get bans from the server
                bans = await message.guild.bans.fetch();

                // Check if user is banned
                if(bans.has(user.id)) {
                    // If user is banned then use the mod know
                    return message.reply(`You silly! ${user} is already banned!`);
                };
                

                // If user is undefined let the moderator know
                if(user === undefined) {
                    return message.reply(`Uh oh! Looks like I wasn't able to find that user, please check the user id and try again or try using a user mention like so: \`@Username\``);
                }
            }

            // Check if a reason was given
            if(newArgs[1] && user !== undefined) {
                // If a length wasn't given then let the user know it is required
                if(!newArgs[2]) {
                    return message.reply(`Uh oh! It seems you forgot to give a length for ther ban, please be sure to provide a ban length for this action!\nExample: \`${prefix}ban ${user}, reason, length\``);

                // If both a reason and length were given ban the user and log the action in the database
                } else {

                    const reason = newArgs[1]; //assign the ban reason
                    let banLength = newArgs[2]; //assign the ban length
                    let banValue = banLength.replace(/\D+/, '').trim(); //assign the ban value
                    let banUnit = banLength.replace(/\d+/, '').trim(); //assign the ban unit
                    const now = moment();
                    const banLengthRegex = /(\d+\s*\D+$|^permanent$|^perma$|^perm$|^p{1}$){1}/; //regex for ban time format

                    // Check if the user input for a perma ban
                    if(banUnit.toLowerCase() === "p" || banUnit.toLowerCase().includes("perm")) {
                        banValue = 999; // assign value
                        banUnit = "years"; // set unit
                        banLength = "an indefinite amount of time"; // set length for description
                    // If the user input a duration shorter than 1 hour
                    } else if (banUnit.toLowerCase().includes("min") || banUnit.toLowerCase().includes("sec") || banUnit === "s" || banUnit === "m") {
                        return message.reply(`Please provide a ban time that is at least 1 hour long.`);
                    // Check if the user provided an accepted format
                    } else if(!banLength.match(banLengthRegex)) {
                        return message.reply(`Uh oh! It seems like you entered an invalue ban duration! Please use formats such as these for the ban duration: \`6 years\`, \`17d\`, \`permanent\`, \`3 wks\``)
                    }

                    let unbanDate = now.add(banValue, banUnit); //create the unban date

                    // Make sure the unban date is after the current time
                    if(moment(unbanDate).isAfter(now)) {
                        // If not after the current time, let the user know how to fix the problem
                        return message.reply("Uh oh! Looks like you have an invalid duration! Please try again with a proper unit of time and number duration!");
                    }

                    

                    /* 
                    * Sync the model to the table
                    * Creates a new table if table doesn't exist, otherwise just inserts a new row
                    * id, completed, createdAt, and updatedAt are set by default; DO NOT ADD
                    !!!!
                        Keep force set to false otherwise it will overwrite the table instead of making a new row!
                    !!!!
                    */
                    Models.ban.sync({ force: false }).then(() => {
                        // Add the ban record to the database
                        Models.ban.create({
                            user_id: user.id,
                            guild_id: message.guild.id,
                            reason: reason,
                            unban_date: unbanDate,
                            moderator_id: message.author.id,
                        })
                        // Let the user know it was added
                        .then(() => {
                            // Create the banned embed
                            const banEmbed = {
                                color: 0xFF0000,
                                title: `User Was Banned!`,
                                author: {
                                    name: `${user.username}#${user.discriminator}`,
                                    icon_url: user.displayAvatarURL({dynamic:true}),
                                },
                                description: `${user} was banned from the server by ${message.author} for ${banLength}!`,
                                fields: [
                                    {
                                        name: `User Banned`,
                                        value: `${user}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Banned By`,
                                        value: `${message.author}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Unban Date`,
                                        value: `${Discord.Formatters.time(unbanDate.toDate(), "f")} (${Discord.Formatters.time(unbanDate.toDate(), "R")})`,
                                        inline: true,
                                    },
                                    {
                                        name: `Messages Cleared`,
                                        value: `${msgCleared}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Reason`,
                                        value: `${reason}`,
                                        inline: false,
                                    }
                                ],
                                timestamp: new Date(),
                            };

                            /* 
                            * Sync the model to the table
                            * Creates a new table if table doesn't exist, otherwise just inserts a new row
                            * id, createdAt, and updatedAt are set by default; DO NOT ADD
                            !!!!
                                Keep force set to false otherwise it will overwrite the table instead of making a new row!
                            !!!!
                            */
                            Models.warning.sync({ force: false }).then(() => { 
                                // See if the warning id exists already
                                Models.warning.findOne({where: {warning_id: warnId}, raw:true}).then((warning => {
                                    // If the warning id matches the newly generated one, generate a new one
                                    if(warning) {
                                        warnId = shortid.generate();
                                    };
                                })).then(() => { 
                                    // Create a new warning
                                    Models.warning.create({
                                        warning_id: warnId, // add the warning Id
                                        user_id: user.id, // add the user's id
                                        type: "Banned", // assign the type of warning
                                        reason: reason, // add the reason for the warning
                                        username: user.username, // add the username
                                        mod_id: message.author.id
                                    }).then(() => {

                                        // Ban the user from the server
                                        message.guild.members.ban(user.id, {days: msgDel, reason: reason}).then(() => {
                                            // Send the embed to the action log channel
                                            actionLog.send({embeds: [banEmbed]});
                                            message.channel.send(`${user.username} was successfully banned for ${banLength}!`)
                                        });
                                    });
                                });
                            });
                        });
                    });
                }

            // If no reason was given let the user know it is required
            } else {
                // Check if a user mention was used
                if(message.mentions.users.first()) {
                    // Let user know a reason is needed
                    message.reply(`Uh oh! It seems you forgot to give a reason for banning, please be sure to provide a reason for this action!\nExample: \`${prefix}ban @${user.tag}, reason, length\``);

                // If no user mention was given then just output the id they provided
                } else {
                    // Let user know a reason is needed
                    message.reply(`Uh oh! It seems you forgot to give a reason for banning, please be sure to provide a reason for this action!\nExample: \`${prefix}ban ${user}, reason, length\``);
                }
            }
        }
    },
    unbanHandler: function(a, m, c) {
        const args = a, message = m, client = c;
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        let user; // user var

        // Check if the first arg is a number
        if(isNaN(args[0])) {
            // Attempt to fix the arg for the user by removing the comma if the moderator forgot to add a space after the id and before the comma
            args[0] = args[0].replace(",", "");
        }

        // Make sure the first arg was a user id
        if(isNaN(args[0])) {
            // Let user know they need to provide a valid user id
            message.reply(`Uh oh! Looks like you gave an invalid user id. Make sure that you are providing a valid user id!`);
        } else {
            let userId = args[0];

            // Attempt to fetch the user
            client.users.fetch(userId).then((u) => {
                user = u; //assign user

                // If a reason was given then unban the user and log the action to the database
                if(args[1]) {
                    let reasonArr = args;
                    let reason;
                    reasonArr.shift(); //remove the first arg (user id)
                    reason = reasonArr.join(" "); //turn the array into a string
                    reason = reason.replace(',', ''); // remove the first comma from the string
                    reason = reason.trim(); // remove any excess whitespace

                    // Fetch the ban from the server
                    message.guild.bans.fetch(user).then(() => {
                        
                        // Search the db for the ban
                        Models.ban.findOne({where: {user_id: userId, completed: 0}, raw:true}).then((data) => {

                            // Make sure data was retrieved
                            if(data) {
                                const banDate = moment(data.createdAt); //assign ban date
                                const banReason = data.reason; //assign ban reason
                                /* 
                                * Sync the model to the table
                                * Creates a new table if table doesn't exist, otherwise just inserts a new row
                                * id, createdAt, and updatedAt are set by default; DO NOT ADD
                                !!!!
                                    Keep force set to false otherwise it will overwrite the table instead of making a new row!
                                !!!!
                                */
                                Models.unban.sync({ force: false }).then(() => {

                                    // Add the unban record to the database
                                    Models.unban.create({
                                        user_id: userId,
                                        reason: reason,
                                        type: "Manual",
                                        moderator_id: message.author.id,
                                    })
                                    // Let the user know it was added
                                    .then(() => {

                                        // Create the unban embed
                                        const unbanEmbed = {
                                            color: 0xFF5500,
                                            title: `User Was Unbanned!`,
                                            author: {
                                                name: `${user.username}#${user.discriminator}`,
                                                icon_url: user.displayAvatarURL({dynamic:true}),
                                            },
                                            description: `${user} was unbanned from the server by ${message.author}`,
                                            fields: [
                                                {
                                                    name: `User Unbanned`,
                                                    value: `${user}`,
                                                    inline: true,
                                                },
                                                {
                                                    name: `Unbanned By`,
                                                    value: `${message.author}`,
                                                    inline: true,
                                                },
                                                {
                                                    name: `Unban Reason`,
                                                    value: `${reason}`,
                                                    inline: false,
                                                },
                                                {
                                                    name: `Ban Date`,
                                                    value: `${Discord.Formatters.time(banDate.toDate(), "f")} (${Discord.Formatters.time(banDate.toDate(), "R")})`,
                                                    inline: false,
                                                },
                                                {
                                                    name: `Ban Reason`,
                                                    value: `${banReason}`,
                                                    inline: false,
                                                }
                                            ],
                                            timestamp: new Date(),
                                        };
                                        // Unban the user from the server
                                        message.guild.members.unban(userId).then(() => {

                                            // Update the completed field for the ban
                                            Models.ban.update({completed: 1}, {where: {user_id: userId}});

                                            // Send the embed to the action log channel
                                            actionLog.send({embeds: [unbanEmbed]});

                                            // Reply with a message
                                            message.channel.send(`${user.username} was successfully unbanned!`)
                                        });
                                    });
                                });
                            } else {
                                // If no data was found in the db
                                message.channel.send(`Uh oh, it looks like there is no information on this ban in the database!`)
                            }
                        });
                    }).catch((e) => {
                        // If no ban was found for that user
                        return message.reply(`You silly! ${user} isn't banned!`)
                    });
                } else {
                    // Let user know a reason is needed
                    message.reply(`Uh oh! It seems you forgot to give a reason for unbanning, please be sure to provide a reason for this action!\nExample: \`${prefix}unban ${userId}, reason\``);
                };
            }).catch((e) => {
                // Let the user know there was no user with the given id
                return message.reply(`Uh oh! Looks like there is no user with the id \`${userId}\``);
            });
        }
    },
    warnHandler: function(interaction) {
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const user = interaction.options.getUser(`user`); //var for the user
        const reason = interaction.options.getString(`reason`); //var for warning reason
        const member = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(user.id);

        // Create a new table if one doesn't exist !! Add alter true to add any new columns in the model ~~
        Models.warning.sync({ force: false, alter: true }).then(() => { 
            // Create a new warning
            Models.warning.create({
                user_id: user.id, // add the user's id
                username: user.username, // add the user's username
                nickname: member.nickname, // add the nickname of the member
                type: "Note", // assign the type of warning
                reason: reason, // add the reason for the warning
                mod_id: interaction.member.id
            }).then((item) => {
                // Create the warn embed
                const warnEmbed = {
                    color: 0xFF5500,
                    title: `A New Warning Was Issued To ${user.username}`,
                    author: {
                        name: interaction.member.username,
                        icon_url: interaction.member.displayAvatarURL({dynamic:true}),
                    },
                    description: `${interaction.member} has added a warning to ${user}!`,
                    fields: [
                        {
                            name: `User Warned`,
                            value: `${user}`,
                            inline: true,
                        },
                        {
                            name: `Warned By`,
                            value: `${interaction.member}`,
                            inline: true,
                        },
                        {
                            name: `Warning`,
                            value: `${reason}`,
                            inline: false,
                        },
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: `Warning Id: ${item.id}`,
                    }
                };

                actionLog.send({embeds: [warnEmbed]}); //send embed
                interaction.reply({content: `${user.username} was successfully warned!`, ephemeral: true});
            });
        });
        
    },
    muteHandler: function(a, m, c) {
        const args = a, message = m, client = c;
        let user;
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        // In Role? Boolean variables
        const inSuperRole = message.member.roles.cache.some(role => role.id === client.settings.get("super_role_id"));
        const inAdminRole = message.member.roles.cache.some(role => role.id === client.settings.get("admin_role_id"));
        const isOwner = message.member.guild.owner;
        // Roles
        const modTraineeRole = message.guild.roles.cache.find(role => role.id === client.settings.get("trainee_role_id"));
        const modRole = message.guild.roles.cache.find(role => role.id === client.settings.get("mod_role_id"));
        const superRole = message.guild.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.guild.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));

        let argsStr = args.join(" "); //create a string out of the args
        argsStr = argsStr.replace(/,/g, ", "); // replace
        const newArgs = argsStr.split(",").map(i => i.trim()); //create a new args array and trim the whitespace from the items

        // Check for user by id
        if(!isNaN(newArgs[0])) {
            // If invalid id let the user know
            if(message.guild.members.cache.get(newArgs[0]) === undefined) {
                return message.reply(`Uh oh! Looks like I wasn't able to find that user, please check the user id and try again or try using a user mention like so: \`@Username\``);

            // If user found, assign it to the user var
            } else {
                user = message.guild.members.cache.get(newArgs[0]);
            }
        // Check if a user mention was given
        } else if (newArgs[0].startsWith("<@")) {
            user = message.mentions.members.first(); // get user tag
            if(!user) {
                // Let the user know they provided an invalid user mention
                return message.reply(`Uh oh! Looks like you gave an invalid user mention. Make sure that you are mentioning a valid user!`);
            }
        } else {
            // Let user know they need to provide a user mention or a valid user id
            return message.reply(`Uh oh! You must provide me with a user mention or id so I know who to mute!`);
        }

        // If user is a bot then deny banning it
        if(user.user.bot) {
            return message.channel.send(`You can't mute no beep boop!`);
        // If the user tries to ban themselves then deny banning them
        } else if(user.user.id === message.author.id) {
            return message.reply(`You can't mute yourself, silly!`);
        // If the user is a mod+ then deny banning them
        } else if(user.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name))) {
            return message.reply(`You got guts, trying to mute a ${user.roles.highest} member!`);
        // If the user is the server owner then deny banning them
        } else if (user.user.id === user.guild.ownerID) {
            return message.reply(`I hope you didn't really think you could mute the server owner...`);
        }

        // Make sure the type of mute was given
        if(newArgs[1]) {
            const muteTypes = ["server", "voice", "text", "reactions"]; // accepted types

            // Make sure the type given is an accepted type
            if(muteTypes.indexOf(newArgs[1].toLowerCase()) > -1) {
                const muteType = newArgs[1].toLowerCase(); // type of mute

                // Check if a reason was given
                if(newArgs[2] && user !== undefined) {
                    // If a length wasn't given then let the user know it is required
                    if(!newArgs[3]) {
                        return message.reply(`Uh oh! It seems you forgot a required part of the mute command, please be sure to provide all options for this action!\nExample: \`${prefix}mute ${user}, type, reason, length\``);
                    }

                    const reason = newArgs[2]; //assign the mute reason
                    let muteLength = newArgs[3]; //assign the mute length
                    let muteValue = muteLength.replace(/\D+/, '').trim(); //assign the mute value
                    let muteUnit = muteLength.replace(/\d+/, '').trim(); //assign the mute unit
                    const now = moment();
                    const timezone = moment().tz(moment.tz.guess()).format(`z`); // server timezone
                    const muteLengthRegex = /(\d+\s*\D+$|^permanent$|^perma$|^perm$|^p{1}){1}/; //regex for mute time format
                    let mutedRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === `muted - ${muteType}`); //muted role
                    let unmuteDate;

                    // Check if the user input for a perma mute
                    if(muteUnit.toLowerCase().includes("perm")) {
                        muteValue = 999; // assign value
                        muteUnit = "years"; // set unit
                        muteLength = "an indefinite amount of time"; // set length for description
                    // Check if the user provided an accepted format
                    } else if (muteUnit.toLowerCase().includes("min")) {
                        muteUnit = "minutes";
                    } else if(!muteLength.match(muteLengthRegex)) {
                        return message.reply(`Uh oh! It seems like you entered an invalue mute duration! Please use formats such as these for the mute duration: \`6 years\`, \`17d\`, \`permanent\`, \`3 wks\``)
                    } else if (muteUnit.toLowerCase() === "sec" || muteUnit.toLowerCase() === "secs" || muteUnit.toLowerCase() === "seconds" || muteUnit.toLowerCase() === "second") {
                        return message.reply(`Please give a duration that is at least 1 minute in length!`);
                    }

                    unmuteDate = now.add(muteValue, muteUnit); //create the unmute date

                    // Make sure the unban date is after the current time
                    if(moment(unmuteDate).isAfter(now)) {
                        // If not after the current time, let the user know how to fix the problem
                        return message.reply("Uh oh! Looks like you have an invalid duration! Please try again with a proper unit of time and number duration!");
                    }

                    // Check if user is in the muted role
                    const inMutedRole = user.roles.cache.some(role => role.name.toLowerCase().includes(`muted - ${muteType}`));

                    // If no muted role exists let user know
                    if(!mutedRole) {
                        // Check if user is a super or higher role
                        if(inSuperRole || inAdminRole || isOwner) {
                            return message.reply(`Uh oh! It seems there isn't a muted - ${muteType} role, please use \`${prefix}createmute\` to make the role!`);
                        // If not a super or higher let them know to ask a super or higher
                        } else {
                            // If no muted role let user know to create it
                            return message.reply(`Uh oh! It seems there isn't a muted - ${muteType} role, please ask a ${superRole} or ${adminRole} to make the role with \`${prefix}createmute\`!`);
                        }
                    }

                    // If user is already muted let user know
                    if(inMutedRole) {
                        return message.reply(`Uh oh! Looks like ${user.displayName} is already muted!`)
                    }

                    /* 
                    * Sync the model to the table
                    * Creates a new table if table doesn't exist, otherwise just inserts a new row
                    * id, completed, createdAt, and updatedAt are set by default; DO NOT ADD
                    !!!!
                        Keep force set to false otherwise it will overwrite the table instead of making a new row!
                    !!!!
                    */
                    Models.mute.sync({force: false}).then(() => {
                        // Add the ban record to the database
                        Models.mute.create({
                            user_id: user.id,
                            guild_id: message.guild.id,
                            type: muteType,
                            reason: reason,
                            unmute_date: unmuteDate,
                            moderator_id: message.author.id,
                        })
                        // Let the user know it was added
                        .then(() => {
                            // Add the user to the muted role
                            user.roles.add(mutedRole).then(() => {
                                // Create the banned embed
                                const muteEmbed = {
                                    color: 0xFF0000,
                                    title: `User Was Muted!`,
                                    author: {
                                        name: `${user.user.username}#${user.user.discriminator}`,
                                        icon_url: user.user.displayAvatarURL({dynamic:true}),
                                    },
                                    description: `${user} was muted by ${message.author} for ${muteLength}!`,
                                    fields: [
                                        {
                                            name: `User Muted`,
                                            value: `${user}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Mute Type`,
                                            value: `${muteType}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Muted By`,
                                            value: `${message.author}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Unmute Date`,
                                            value: `${Discord.Formatters.time(unmuteDate.toDate(), "f")} (${Discord.Formatters.time(unmuteDate.toDate(), "R")})`,
                                            inline: false,
                                        },
                                        {
                                            name: `Reason`,
                                            value: `${reason}`,
                                            inline: false,
                                        }
                                    ],
                                    timestamp: new Date(),
                                };
                                actionLog.send({embeds: [muteEmbed]});
                                message.channel.send(`${user.displayName} was successfully muted for ${muteLength}!`);
                            });
                        });
                    });
                // If no reason was given let the user know it is required
                } else {
                    // Check if a user mention was used
                    if(message.mentions.users.first()) {
                        // Let user know a reason is needed
                        message.reply(`Uh oh! It seems you forgot to give a reason for muting, please be sure to provide a reason for this action!\nExample: \`${prefix}mute @${user.user.tag}, type, reason, length\``);

                    // If no user mention was given then just output the id they provided
                    } else {
                        // Let user know a reason is needed
                        message.reply(`Uh oh! It seems you forgot to give a reason for muting, please be sure to provide a reason for this action!\nExample: \`${prefix}mute ${user}, type, reason, length\``);
                    }
                };
                
            } else {
                return message.reply(`Uh oh! It seems you gave an unaccepted type of mute! Make sure you choose a mute from this list:  __server__, __voice__, __text__, or __reactions__`)
            }
        } else {
            // Check if a user mention was used
            if(message.mentions.users.first()) {
                // Let user know a type is needed
                return message.reply(`Uh oh! It seems you forgot to tell me the type of mute to perform on the user! Please try again with the accepted mute types: __server__, __voice__, __text__, or __reactions__!\nExample: \`${prefix}mute @${user.user.tag}, type, reason, length\``);

            // If no user mention was given then just output the id they provided
            } else {
                // Let user know a type is needed
                return message.reply(`Uh oh! It seems you forgot to tell me the type of mute to perform on the user! Please try again with the accepted mute types: __server__, __voice__, __text__, or __reactions__!\nExample: \`${prefix}mute @${user}, type, reason, length\``);
            }
        }
    },
    unmuteHandler: function(m, a, c) {
        const message = m, args = a, client = c;
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        // In Role? Boolean variables
        const inSuperRole = message.member.roles.cache.some(role => role.id === client.settings.get("super_role_id"));
        const inAdminRole = message.member.roles.cache.some(role => role.id === client.settings.get("admin_role_id"));
        const isOwner = message.member.guild.owner;
        // Roles
        const superRole = message.guild.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.guild.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));

        // Check if the first arg is a number
        if(isNaN(args[0])) {
            // Attempt to fix the arg for the user by removing the comma if the moderator forgot to add a space after the id and before the comma
            args[0] = args[0].replace(",", "");
        }

        // Check for user by id
        if(!isNaN(args[0])) {
            // If invalid id let the user know
            if(message.guild.members.cache.get(args[0]) === undefined) {
                return message.reply(`Uh oh! Looks like I wasn't able to find that user, please check the user id and try again or try using a user mention like so: \`@Username\``);

            // If user found, assign it to the user var
            } else {
                user = message.guild.members.cache.get(args[0]);
            }
        // Check if a user mention was given
        } else if (args[0].startsWith("<@")) {
            user = message.mentions.members.first(); // get user tag
            if(!user) {
                // Let the user know they provided an invalid user mention
                return message.reply(`Uh oh! Looks like you gave an invalid user mention. Make sure that you are mentioning a valid user!`);
            }
        } else {
            // Let user know they need to provide a user mention or a valid user id
            return message.reply(`Uh oh! You must provide me with a user mention or id so I know who to mute!`);
        }

        // Muted role
        let mutedRole = user.roles.cache.find(r => r.name.toLowerCase().includes("muted")); //muted role

        // Make sure the user is muted
        if(!mutedRole) {
            return message.reply(`You silly! You can't unmute a user that isn't muted!`);
        }

        // If a reason was given then unban the user and log the action to the database
        if(args[1]) {
            let reasonArr = args;
            let reason;
            let userId = user.id;
            reasonArr.shift(); //remove the first arg (user id)
            reason = reasonArr.join(" "); //turn the array into a string
            reason = reason.replace(',', ''); // remove the first comma from the string
            reason = reason.trim(); // remove any excess whitespace
            const inMutedRole = user.roles.cache.some(role => role.name.includes("Muted"));

            // If the user isn't already muted let the mod know
            if(!inMutedRole) {
                return message.reply(`Uh oh! Looks like ${user.displayName} isn't muted!`)
            }

            // Search the db for the mute
            Models.mute.findOne({where: {user_id: userId, completed: 0}, raw: true}).then((data) => {
                // Make sure data was retrieved
                if(data) {
                    const muteDate = data.createdAt; //assign mute date
                    const muteReason = data.reason; //assign mute reason
                    /* 
                    * Sync the model to the table
                    * Creates a new table if table doesn't exist, otherwise just inserts a new row
                    * id, createdAt, and updatedAt are set by default; DO NOT ADD
                    !!!!
                        Keep force set to false otherwise it will overwrite the table instead of making a new row!
                    !!!!
                    */
                    Models.unmute.sync({ force: false }).then(() => {

                        // Add the unmute record to the database
                        Models.unmute.create({
                            user_id: userId,
                            reason: reason,
                            type: "Manual",
                            moderator_id: message.author.id,
                        })
                        // Let the user know it was added
                        .then(() => {
                            // Remove user from the muted role
                            user.roles.remove(mutedRole).then(() => {
                                // Create the unmute embed
                                const unmuteEmbed = {
                                    color: 0xFF5500,
                                    title: `User Was Unmuted!`,
                                    author: {
                                        name: `${user.user.username}#${user.user.discriminator}`,
                                        icon_url: user.user.displayAvatarURL({dynamic:true}),
                                    },
                                    description: `${user} was unmuted from the server by ${message.author}`,
                                    fields: [
                                        {
                                            name: `User Unmuted`,
                                            value: `${user}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Unmuted By`,
                                            value: `${message.author}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Unmute Reason`,
                                            value: `${reason}`,
                                            inline: false,
                                        },
                                        {
                                            name: `Mute Date`,
                                            value: `${Discord.Formatters.time(muteDate, "f")} (${Discord.Formatters.time(muteDate, "R")})`,
                                            inline: false,
                                        },
                                        {
                                            name: `Mute Reason`,
                                            value: `${muteReason}`,
                                            inline: false,
                                        }
                                    ],
                                    timestamp: new Date(),
                                };
                                // Send log to mod log and give feedback to user
                                actionLog.send({embeds: [unmuteEmbed]});
                                message.channel.send(`${user.displayName} was successfully unmuted!`).then(() => {
                                    // Update the completed field for the mute
                                    Models.mute.update({completed: 1}, {where: {user_id: userId}});
                                });
                            });
                        });
                    });
                };
            });

        } else {
            // Let the user know a reason is needed
            message.reply(`Uh oh! It seems you forgot to give a reason for unmuting, please be sure to provide a reason for this action!\nExample: \`${prefix}unmute ${user}, reason\``);
        }
    },
    createMuteHandler: async function(m, c) {
        const message = m, client = c;
        const usersRole = message.guild.roles.cache.find(role => role.id === client.settings.get("user_role_id")); //users role
        let mutedServer = message.guild.roles.cache.find(r => r.name === "Muted - Server"); //muted server role
        let mutedVoice = message.guild.roles.cache.find(r => r.name === "Muted - Voice"); //muted voice role
        let mutedText = message.guild.roles.cache.find(r => r.name === "Muted - Text"); //muted text role
        let mutedReactions = message.guild.roles.cache.find(r => r.name === "Muted - Reactions"); //muted Reactions role
        let roles = [];

        // Check if the muted roles exists
        if(!mutedServer || !mutedVoice || !mutedText || !mutedReactions) {

            // If no Muted - Server role
            if(!mutedServer) {
                // If no Muted - Server role then create one
                mutedServer = await message.guild.roles.create({
                    name: `Muted - Server`,
                    color: `#818386`,
                    position: `${usersRole.position + 1}`,
                    permissions: [], //set permissions to an empty array so no permissions are given
                    reason: `No "Muted - Server" role, need one to mute users!`
                });

                // Loop through all channels channels
                message.guild.channels.cache.forEach(async (channel) => {
                    // Ignore threads since they don't have permissions
                    if(channel.type !== "GUILD_PUBLIC_THREAD" && channel.type !== "GUILD_PRIVATE_THREAD") {
                        // Deny the ability to send messages, speak, add reactions, and use voice activity for each channel for the Muted - Server role
                        await channel.permissionOverwrites.edit(mutedServer, {
                            SEND_MESSAGES: false,
                            SPEAK: false,
                            ADD_REACTIONS: false,
                            USE_VAD: false,
                            USE_PUBLIC_THREADS: false,
                            USE_PRIVATE_THREADS: false
                        });
                    };
                });

                // Add the newly created role to the array
                roles.push(mutedServer);
            }

            // If no Muted - Voice role
            if(!mutedVoice) {
                // If no Muted - Voice role then create one
                mutedVoice = await message.guild.roles.create({
                    name: `Muted - Voice`,
                    color: `#818386`,
                    position: `${usersRole.position + 1}`,
                    permissions: [], //set permissions to an empty array so no permissions are given
                    reason: `No "Muted - Voice" role, need one to mute users!`
                });

                // Loop through all channels channels
                message.guild.channels.cache.forEach(async (channel) => {
                    // Ignore threads since they don't have permissions
                    if(channel.type !== "GUILD_PUBLIC_THREAD" && channel.type !== "GUILD_PRIVATE_THREAD") {
                        // Deny the ability to speak and use voice activity for each channel for the Muted - Voice role
                        await channel.permissionOverwrites.edit(mutedVoice, {
                            SPEAK: false,
                            USE_VAD: false
                        });
                    };
                });

                // Add the newly created role to the array
                roles.push(mutedVoice);
            }

            // If no Muted - Text role
            if(!mutedText) {
                // If no Muted - Text role then create one
                mutedText = await message.guild.roles.create({
                    name: `Muted - Text`,
                    color: `#818386`,
                    position: `${usersRole.position + 1}`,
                    permissions: [], //set permissions to an empty array so no permissions are given
                    reason: `No "Muted - Text" role, need one to mute users!`
                });

                // Loop through all channels channels
                message.guild.channels.cache.forEach(async (channel) => {
                    // Ignore threads since they don't have permissions
                    if(channel.type !== "GUILD_PUBLIC_THREAD" && channel.type !== "GUILD_PRIVATE_THREAD") {
                        // Deny the ability to send messages for each channel for the Muted - Text role
                        await channel.permissionOverwrites.edit(mutedText, {
                            SendMessages: false,
                            UsePublicThreads: false,
                            UsePrivateThreads: false
                        });
                    };
                });

                // Add the newly created role to the array
                roles.push(mutedText);
            }

            // If no Muted - Reactions role
            if(!mutedReactions) {
                // If no Muted - Reactions role then create one
                mutedReactions = await message.guild.roles.create({
                    name: `Muted - Reactions`,
                    color: `#818386`,
                    position: `${usersRole.position + 1}`,
                    permissions: [], //set permissions to an empty array so no permissions are given
                    reason: `No "Muted - Reactions" role, need one to mute users!`
                });

                // Loop through all channels channels
                message.guild.channels.cache.forEach(async (channel) => {
                    // Ignore threads since they don't have permissions
                    if(channel.type !== "GUILD_PUBLIC_THREAD" && channel.type !== "GUILD_PRIVATE_THREAD") {
                        // Deny the ability to add reactions for each channel for the Muted - Reactions role
                        await channel.permissionOverwrites.edit(mutedReactions, {
                            AddReactions: false
                        });
                    }
                });

                // Add the newly created role to the array
                roles.push(mutedReactions);
            }

            message.channel.send(`The ${roles} role(s) was successfully created!`)
        } else {
            return message.reply(`Uh oh! Looks like the muted roles already exist!`)
        }
    },
    blacklistHandler: function(m, ar, c, tl, bu) {
        const message = m, args = ar, client = c, triggers = tl, bannedUrls = bu;
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        const subCommand = args.shift(); //remove the first arg and store it in the subcommand var
        const allowedSubCommands = ["view", "list", "add", "create", "delete", "remove"];
        // In role? Boolean
        const inSuperRole = message.member.roles.cache.some(role => role.id === client.settings.get("super_role_id"));
        const inAdminRole = message.member.roles.cache.some(role => role.id === client.settings.get("admin_role_id"));
        const isOwner = message.member.guild.owner;
        // Role vars
        const superRole = message.guild.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.guild.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));
        let domains = args.join(","); //create string of for all domains
        domains = domains.split(","); //create array from all domains
        domains = domains.filter(i=>i); //remove any null values

        // Make sure a proper subcommand was given
        if(!allowedSubCommands.includes(subCommand.toLowerCase())) {
            return message.channel.send(`You didn't give a proper subcommand for me to use, please choose from the list below:\n**${allowedSubCommands.join(", ")}**`)
        } else {
            /*
            #################################
            ######## list subcommand ########
            #################################
            */
            if(["view", "list"].includes(subCommand.toLowerCase())) {
                let blacklistedDomains = [];

                // Find all the blacklisted domains from the db
                Models.bannedurl.findAll().then((data) => {
                    // If there was any data
                    if(data) {
                        // Add each item to the blacklistedDomains array
                        data.forEach((item) => {
                            blacklistedDomains.push(`**${item.get('url')}**`);
                        });
                    }
                }).then(() => {
                    blacklistedDomains = blacklistedDomains.join(", "); //create a string from array
                    // Try to send the list; will fail if exceeding character limit
                    try {
                        // Create embed
                        const blacklistsEmbed = {
                            color: 0x33CCFF,
                            title: `Blacklist Domains`,
                            description: `${blacklistedDomains}`,
                            timestamp: new Date()
                        };
                        // Send the embed to the action log channel
                        actionLog.send({embeds: [blacklistsEmbed]});
                        // Let user know the data was sent
                        return message.channel.send(`I've sent the data you requested to ${actionLog}`)
                        
                    // If exceeded the character limit let user know
                    } catch(e) {
                        return message.channel.send(`There are too many domains to display currently!`);
                    }
                })
            /*
            ################################
            ######## add subcommand ########
            ################################
            */
            } else if(["add", "create"].includes(subCommand.toLowerCase())) {
                // Make sure array has values
                if(domains.length === 0) {
                    return message.reply(`Uh oh! Looks like you forgot to give me the url(s) to add!`)
                } else {

                    // Regex for ensuring valid url
                    const domainRegEx = /^(?:https?\:\/\/)?(?:.+\.)?([A-Za-z0-9-]+\.\w+)(?:\/?[^\s]+)?$/g;
                    let acceptedInput = [];
                    let deniedInput = [];

                    // If only one domain was given and it doesn't match the regex let user know
                    if(domains.length === 1 && !domains[0].match(domainRegEx)) {
                        return message.channel.send(`${domains[0]} was an invalid url/domains, please try again!`)
                    }

                    // // Loop through each arg given after the subcommand
                    domains.forEach((domain) => {
                        // If a valid url
                        if(domain.match(domainRegEx)){
                            // Strip the url to only get the domain name and tld (and sub domains)
                            const newDomain = domain.replace(/(https?:\/\/(w+\.)?|\/(.+)?)/g, "");
                            // Add the domain to acceptedInput array
                            acceptedInput.push(newDomain);

                        // If not a valid url
                        } else {
                            // Add to deniedInput array
                            deniedInput.push(domain)
                        }
                    });

                    /* 
                    * Sync the model to the table
                    * Creates a new table if table doesn't exist, otherwise just inserts a new row
                    * id, createdAt, and updatedAt are set by default; DO NOT ADD
                    !!!!
                        Keep force set to false otherwise it will overwrite the table instead of making a new row!
                    !!!!
                    */
                    Models.bannedurl.sync({force: false}).then(() => {
                        // If only one domain was given
                        if(domains.length === 1) {
                            // Add the domain to the database
                            Models.bannedurl.create({
                                url: domains[0],
                                added_by: message.author.id,
                            }).then(() => {

                                // Create the embed
                                const blacklistEmbed = {
                                    color: 0x00FF00,
                                    title: `Domain Blacklist Added`,
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL({dynamic: true}),
                                    },
                                    description: `${message.author.username} has blacklisted a new domain!`,
                                    fields: [
                                        {
                                            name: `Domain Added`,
                                            value: `${domains[0]}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Added By`,
                                            value: `${message.author}`,
                                            inline: true,
                                        }, 
                                    ],
                                    timestamp: new Date()
                                }

                                // Add the url to the bannedUrls List
                                bannedUrls.list.push(domains[0]);

                                // Send the embed to the action log channel
                                actionLog.send({embeds: [blacklistEmbed]});
                                // Let the user know the domain was added
                                message.channel.send(`${domains[0]} was successfully added to the list of banned domains!`);
                            })
                        // If more than one domain was given
                        } else if(domains.length > 1) {
                            let bulkDomains = [];

                            // Loop through the accepted input
                            acceptedInput.forEach((item) => {
                                // Create a new comain object
                                let domainObj = {
                                    url: item,
                                    added_by: message.author.id,
                                };
                                // Add the domain object to the bulkDomains array
                                bulkDomains.push(domainObj);
                            });
                            // Create multiple rows of domains
                            Models.bannedurl.bulkCreate(bulkDomains).then(() => {
                                const addedDomains = acceptedInput.join(", ");
                                const rejectedDomains = deniedInput.join(", ");
                    
                                // Create the embed
                                const blacklistsEmbed = {
                                    color: 0x00FF00,
                                    title: `Domain Blacklists Added`,
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL({dynamic: true}),
                                    },
                                    description: `${message.author.username} has blacklisted new domains!`,
                                    fields: [
                                        {
                                            name: `Domains Added`,
                                            value: `${addedDomains}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Rejected Domains`,
                                            value: `${rejectedDomains || "None"}`
                                        },
                                        {
                                            name: `Added By`,
                                            value: `${message.author}`,
                                            inline: true,
                                        }, 
                                    ],
                                    timestamp: new Date()
                                }

                                // Add each domain to the bannedUrls list
                                bulkDomains.forEach((item) => {
                                    bannedUrls.list.push(item);
                                })

                                // Send the embed to the action log channel
                                actionLog.send({embeds: [blacklistsEmbed]});
                                // Let the user know the domain was added
                                message.channel.send(`The domains were successfully added to the list of banned domains, see ${actionLog} for more info!`);
                                // If any domains were rejected let the user know
                                if(deniedInput.length > 0 && deniedInput[0] !== "") {
                                    message.channel.send(`The following domains weren't added to the list of banned domains due to invalid domain format, see ${actionLog} for more info!\n\`${rejectedDomains}\``);
                                }
                            })
                        }
                    });
                }
            /*
            ###################################
            ######## delete subcommand ########
            ###################################
            */
            } else if(["delete", "remove"].includes(subCommand.toLowerCase())) {
                // Make sure user is a super or higher role
                if(!inSuperRole && !inAdminRole && message.author !== isOwner) {
                    // If not let them know to ask a super or higher to remove the domain
                    return message.reply(`Uh oh! You aren't allowed to remove blacklisted domains, if you feel this domain should be removed please ask a ${superRole} or ${adminRole} to delete it!`)
                }
                // If no domain was given let user know
                if(domains.length === 0) {
                    return message.reply(`Uh oh! Looks like you forgot to give me the url(s) to add!`)
                // If more than one domain was given let user know they can only delete one at a time
                } else if(domains.length !== 1) {
                    return message.reply(`Uh oh! You can only delete one domain at a time!`);
                }
                let domain = domains[0]; //domain var

                // Regex for ensuring valid url
                const domainRegEx = /^(?:https?\:\/\/)?(?:.+\.)?([A-Za-z0-9-]+\.\w+)(?:\/?[^\s]+)?$/g;

                // If only one domain was given and it doesn't match the regex let user know
                if(!domain.match(domainRegEx)) {
                    return message.channel.send(`${domains[0]} was an invalid url/domains, please try again!`)
                }

                // Strip the url to only get the domain name and tld (and sub domains)
                const newDomain = domain.replace(/(https?:\/\/(w+\.)?|\/(.+)?)/g, "");

                // Query the database for the domain passed in
                Models.bannedurl.findOne({where: {url: newDomain}}).then((item) => {
                    // If the domain was found, then remove it
                    if (item) {
                        Models.bannedurl.destroy({
                            where: {
                                url: domain
                            }
                        // Let the user know it was removed
                        }).then(() => {

                            // Find the item within the bannedUrls list
                            const itemIndex = bannedUrls.list.indexOf(item);

                            // If the item was found, remove it from the bannedUrls list
                            if(itemIndex) {
                                bannedUrls.list.splice(itemIndex, 1);
                            }

                            // Let user know domain was removed
                            message.channel.send(`I have successfully removed \`${domain}\` from the blacklisted domains!`);
                        });
                    // If the domain wasn't found let the user know
                    } else {
                        message.channel.send(`Unable to find \`${domain}\`, please try again or use \`${prefix}blacklist list\` to view all blacklisted domains!`);
                    };
                });
            }
        }
    },
    handleUrl: function(m, c, rm, deleteSet) {
        const message = m, client = c, regexMatch = rm;
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel

        // Add the message id to the deleteSet
        deleteSet.add(message.id);

        // Create the embed
        const urlEmbed = {
            color: 0xff5500,
            title: `Message Deleted in ${message.channel.name}`,
            author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL({dynamic:true}),
            },
            description: `I have deleted a message by ${message.author} in ${message.channel} because it contained a link that is blacklisted!`,
            fields: [
                {
                    name: `Author`,
                    value: `${message.author}`,
                    inline: true,
                },
                {
                    name: `Channel`,
                    value: `${message.channel}`,
                    inline: true,
                },
                {
                    name: `Link`,
                    value: `${regexMatch[0]}`,
                    inline: false,
                },
                {
                    name: `Full Message`,
                    value: `${regexMatch.input}`,
                    inline: false,
                },
            ],
            timestamp: new Date(),
        };

        // Send the embed to the mod log
        actionLog.send({embeds: [urlEmbed]}).then(() => {
            // Delete the message with a reason
            message.delete({reason: "Blacklisted URL"}).then(() => {
                // Let the user know why their message was deleted
                message.channel.send(`${message.member.displayName} please refrain from posting blacklisted urls!`)
            });
        });
    },
    slowmode: function(interaction) {
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const channel = interaction.options.getChannel(`channel`); //get the channel
        const newInterval = interaction.options.getInteger(`interval`); //get the interval
        const currentInterval = channel.rateLimitPerUser; //get the channel's current interval

        // If the user tried to change the interval to the channel's current interval
        if(currentInterval === newInterval) return interaction.reply({content: `The ${channel}'s message interval is already set to ${newInterval} seconds!`, ephemeral: true});

        // Create the row of buttons
        const btns = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId(`yes`)
                .setLabel(`Yes (Continue)`)
                .setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder()
                .setCustomId(`no`)
                .setLabel(`No (Abort)`)
                .setStyle(Discord.ButtonStyle.Danger)
        )

        // Send the response with the buttons to only the user who initiated the command
        interaction.reply({content: `${channel}'s message interval per user is currently ${currentInterval} seconds, would you like to change it to ${newInterval} seconds?`, ephemeral: true, components: [btns], fetchReply: true})
            .then(async (msg) => {

                // Create the collector to capture the button clicks
                const btnCollector = await msg.createMessageComponentCollector({componentType: Discord.ComponentType.Button, max:1,  time:15000});

                // When a button is clicked
                btnCollector.on(`collect`, i => {
                    // If the user agreed to continue
                    if(i.customId === "yes") {

                        // Set the channel to slowmode
                        channel.edit({rateLimitPerUser: newInterval}).then(() => {
                            // Create the embed
                            const slowmodeEmbed = {
                                color: 0xFF0000,
                                title: `Slowmode Changed`,
                                author: {
                                    name: `${interaction.user.tag}`,
                                    icon_url: `${interaction.member.displayAvatarURL({dynamic: true})}`
                                },
                                description: `${interaction.member.displayName} has changed slowmode for ${channel} from ${currentInterval} seconds to ${newInterval} seconds.`,
                                fields: [
                                    {
                                        name: `Channel`,
                                        value: `${channel}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Slowmode Interval`,
                                        value: `${newInterval} seconds`,
                                        inline: true,
                                    },
                                    {
                                        name: `Changed By`,
                                        value: `${interaction.member}`,
                                        inline: true,
                                    }
                                ],
                                timestamp: new Date(),
                            };

                            actionLog.send({embeds: [slowmodeEmbed]});
                            return i.reply({content: `I have successfully set slowmode for ${channel} to ${newInterval} seconds!`, ephemeral: true});
                        });

                    // If the user wanted to abort
                    } else {
                        return i.reply({content: `Got it! I have aborted this function. ${channel}'s message interval is still set to ${currentInterval} seconds!`, ephemeral: true});
                    }
                })

                // Once the interaction times out
                btnCollector.on(`end`, collected => {

                    // If the user didn't click on one of the buttons let them know it timed out
                    if(collected.size === 0) {
                        interaction.channel.send(`My apologies ${interaction.user}, but your previous interaction has timed out.\nThe command remains unchanged, please try again when you're ready!`);
                    }
                })
        });
    },
    listBans: function(message, args, client) {
        const prefix = client.settings.get("prefix");
        // Get the action log channel
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); 

        // If no args were given, process to list 10 most recent bans
        if(!args.length) {
            // Create embed with basic fields
            const bansEmbed = new Discord.MessageEmbed()
                .setColor(`#33ccff`)
                .setTitle(`10 Latest Bans`)
                .setDescription(`This is basic information on the last 10 bans, for more detailed information pass in the ban id as an argument with this command.\n**Example:** \`${prefix}bans 1\``)
                .setTimestamp()

            // Get 10 bans ordering them by createdAt date
            Models.ban.findAll({limit:10, order:[["createdAt", "DESC"]], raw:true}).then(async (data) => {
                // Make sure there is data
                if(data) {
                    // Loop through the data
                    for(i=0; i < data.length; i++) {
                        // Assign the current ban to a var
                        const ban = data[i];
                        // Find the user
                        const user = await client.users.fetch(ban.user_id);
                        let banned;

                        // Assign the value of banned or not based on the boolean
                        if(ban.completed === 1) {
                            banned = `No`;
                        } else {
                            banned = `Yes`;
                        };

                        // Add the data for the banned user to the embed
                        bansEmbed.addField(`\u200B`,`**ID:** ${ban.id}\n**User:** ${user.tag}\n**Still Banned:** ${banned}`,false);
                    }
                }
            }).then(() => {
                // Send the embed to the mod log
                actionLog.send({embeds: [bansEmbed]});
                // Let the user know the information was sent to the action log channel
                message.reply(`I've sent the data to the ${actionLog} channel`);
            })
        // If an argument was given
        } else {
            // Make sure the id is a valid number
            if(isNaN(args)) {
                // If an invalid number let the user know
                return message.channel.send(`Uh oh! It seems you gave me an invalid id to check for!`)
            } else {
                // Search the database for the requested ban id
                Models.ban.findOne({where:{id: args[0]}, raw: true}).then(async (ban) => {
                    // Make sure there is data for the ban
                    if(ban) {
                        // Find the user and mod
                        const user = await client.users.fetch(ban.user_id);
                        const mod = await client.users.fetch(ban.moderator_id);
                        let completed;

                        // Assign the value for completed based on the boolean
                        if(ban.completed === 1) {
                            completed = "Yes";
                        } else {
                            completed = "No";
                        }

                        // Create the embed
                        const banEmbed = {
                            color: 0x33ccff,
                            title: `Ban #${args[0]}`,
                            author: {
                                name: user.tag,
                                icon_url: user.displayAvatarURL({dynamic: true}),
                            },
                            fields: [
                                {
                                    name: `ID`,
                                    value: args[0],
                                    inline: true
                                },
                                {
                                    name: `User`,
                                    value: user,
                                    inline: true
                                },
                                {
                                    name: `Completed`,
                                    value: completed,
                                    inline: true
                                },
                                {
                                    name: `Moderator`,
                                    value: mod,
                                    inline: true
                                },
                                {
                                    name: `Date Banned`,
                                    value: `${Discord.Formatters.time(ban.createdAt, "f")} (${Discord.Formatters.time(ban.createdAt, "R")})`,
                                    inline: true
                                },
                                {
                                    name: `Unban Date`,
                                    value: `${Discord.Formatters.time(ban.unban_date, "f")} (${Discord.Formatters.time(ban.unban_date, "R")})`,
                                    inline: true
                                },
                                {
                                    name: `Reason`,
                                    value: ban.reason,
                                    inline: false
                                }
                            ],
                            timestamp: new Date()
                        }

                        // Send the embed to the action log channel
                        actionLog.send({embeds: [banEmbed]});
                        // Let the user know the information was sent to the action log channel
                        message.reply(`I've sent the data to the ${actionLog} channel`);
                    }
                }).catch((e) => {
                    message.channel.send(`Uh oh! It seems the id you provided isn't in the database!`);
                })
            }
        }
    },
    roleHandler: function(interaction) {
        const isElder = interaction.member.roles.cache.some(role => role.name.toLowerCase().includes("elder squirrel")); //determine if the user is an Elder Squirrel
        const elderSquirrelRole = interaction.guild.roles.cache.find((r => r.name.toLowerCase().includes(`elder squirrel`))); //Elder Squirrel role
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const isOwner = interaction.user.id === interaction.member.guild.ownerId ? true : false; //determine if the user is the server owner
        const member = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(interaction.options.getUser(`user`).id); //get the member
        const role = interaction.options.getRole(`role`); //get the role
        const subcommand = interaction.options.getSubcommand(); //get the subcommand

        // If the bot isn't able to assign a role, let the mod know
        if(interaction.guild.members.me.roles.highest.position <= role.position) {
            return interaction.reply({content: `Uh oh! I'm not able to assign that role to members!`, ephemeral: true})
        }

        // If the user isn't the owner and tries to give the same level role as their highest role
        if(interaction.member.roles.highest.position == role.position && !isOwner) {
            // Let the user know
            return interaction.reply({content: `Uh oh! You don't have permission to toggle that role!`, ephemeral: true});
        }

        // If the user isn't able to edit the member, deny editing the member and let them know
         if((interaction.member.roles.highest.position <= member.roles.highest.position && (!isOwner && !isElder)) || (interaction.member.roles.highest.position <= role.position && (!isOwner && !isElder))) {
            return interaction.reply({content: `Uh oh! You don't have permission to edit this member!`, ephemeral: true});

        // If the user is able to edit the member
        } else {
            // If add subcommand was used
            if(subcommand === "add") {

                // If the user's highest role is Elder Squirrel and provided a role that isn't the Squirrel Army
                if(isElder && interaction.member.roles.highest.position <= elderSquirrelRole.position && !role.name.toLowerCase().includes(`squirrel army`)) {
                    // Let the Elder Squirrel know they can't assign roles other than Squirrel Army
                    return interaction.reply({content: `Uh oh! You are only allowed to give members the Squirrel Army role!`, ephemeral: true});
                }

                // Check if the member already has the role
                if(member.roles.cache.some(r => r === role)) {
                    // If member already has the role then let author know
                    return interaction.reply({content: `Uh oh! This member is already in that role!`, ephemeral: true})
                }

                // Add the role to the member
                member.roles.add(role).then(() => {
                    // Create embed
                    const addEmbed = {
                        color: 0x886CE4,
                        title: `Role Added To Member`,
                        author: {
                            name: `${interaction.member.displayName}`,
                            icon_url: `${interaction.member.displayAvatarURL()}`
                        },
                        description: `${interaction.member.displayName} has given ${member.displayName} a new role.`,
                        fields: [
                            {
                                name: `Member Edited`,
                                value: `${member}`,
                                inline: false,
                            },
                            {
                                name: `Role Given`,
                                value: `${role}`,
                                inline: false,
                            },
                            {
                                name: `Given By`,
                                value: `${interaction.member}`,
                                inline: false,
                            }
                        ],
                        timestamp: new Date(),
                    };

                    // Send log
                    actionLog.send({embeds: [addEmbed]}).then(() => {
                        // Send feedback
                       interaction.reply({content: `${member.displayName} was successfully added to the ${role.name} role!`, ephemeral: true});
                    });
                });

            // If remove subcommand was used
            } else if(subcommand === "remove") {
                
                // Check if the member already has the role
                if(!member.roles.cache.some(r => r === role)) {
                    // If the member already has the role then let the mod know
                    return interaction.reply({content: `Uh oh! This member isn't in that role!`, ephemeral: true});
                }

                // If the user's highest role is Elder Squirrel and provided a role that isn't the Squirrel Army
                if(isElder && interaction.member.roles.highest.position <= elderSquirrelRole.position && !role.name.toLowerCase().includes(`squirrel army`)) {
                    // Let the Elder Squirrel know they can't assign roles other than Squirrel Army
                    return interaction.reply({content: `Uh oh! You are only allowed to give members the Squirrel Army role!`, ephemeral: true});
                }

                // Remove the role from the member
                member.roles.remove(role).then(() => {
                    // Create embed
                    const removeEmbed = {
                        color: 0x886CE4,
                        title: `Role Removed From Member`,
                        author: {
                            name: `${interaction.member.displayName}`,
                            icon_url: `${interaction.member.displayAvatarURL()}`
                        },
                        description: `${interaction.member.displayName} has removed a role from ${member.displayName}.`,
                        fields: [
                            {
                                name: `Member Edited`,
                                value: `${member}`,
                                inline: false,
                            },
                            {
                                name: `Role Removed`,
                                value: `${role}`,
                                inline: false,
                            },
                            {
                                name: `Removed By`,
                                value: `${interaction.member}`,
                                inline: false,
                            }
                        ],
                        timestamp: new Date(),
                    };

                    // Send log
                    actionLog.send({embeds: [removeEmbed]}).then(() => {
                        // Send feedback
                        interaction.reply({content: `${member.displayName} was successfully removed from the ${role.name} role!`, ephemeral: true});
                    });
                });
            }
        }
    },
    nicknameHandler: async function(interaction) {
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const member = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(interaction.options.getUser(`user`).id); //get the member
        const oldNick = member.nickname; //old nickname var
        const subcommand = interaction.options.getSubcommand(); //subcommand var

        // Set the new nickname based on the nickname's subcommand
        const newNick = subcommand === "reset" ? null : interaction.options.getString(`nickname`);

        // Determind the response based on the nickname's subcommand
        const sameNameReply = subcommand === "reset" ? "Uh oh! This member doesn't have a nickname currently!" : "Uh oh! That is the member's current nickname!";

        // If the member has the same nickname currently let the moderator know
        if (oldNick === newNick) return interaction.reply({content: `${sameNameReply}`, ephemeral: true})

        // Change the member's nickname to the one the moderator gave
        member.setNickname(newNick).then(() => {

            // Let the mod know the member's nickname was changed
            interaction.reply({content: `Done! ${member.user.username}'s nickname is now \`${newNick}\`!`, ephemeral: true});

            // Create the embed
            const nickEmbed = {
                color: 0x886ce4, //purple
                title: `Nickname Changed`,
                author: {
                    name: `${member.user.tag}`,
                    icon_url: member.user.displayAvatarURL({dynamic:true})
                },
                description: `${member.user.username} has had their nickname changed.`,
                fields: [
                    {
                        name: `Member Edited`,
                        value: `${member}`,
                        inline: true
                    },
                    {
                        name: `Edited By`,
                        value: `${interaction.member}`,
                        inline: true
                    },
                    {
                        name: `\u200b`,
                        value: `\u200b`,
                        inline: true
                    },
                    {
                        name: `Previous Nickname`,
                        value: `${oldNick || "None"}`,
                        inline: true
                    },
                    {
                        name: `New Nickname`,
                        value: `${newNick || "None"}`,
                        inline: true
                    }
                ],
                timestamp: new Date(),
            };
            // Send the embed to the action log channel
            actionLog.send({embeds: [nickEmbed]});

        // If unable to change the member's nickname let the moderator know
        }).catch(e => {
            interaction.reply({content: `Uh oh! It seems I'm not able to change that member's nickname, most likely due to permissions!`, ephemeral: true})
        });
        
    },
    tempVoiceHandler: function(message, args, client) {
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        let argsStr = args.join(" "); //join the args together
        const newArgs = argsStr.split(",").map(i => i.trim()); //create a new array by splitting on the comma then remove any whitespace
        const name = newArgs[0].split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' '); //caps the first letter of each word in the name

        // If the user gave too many arguments let them know
        if(newArgs.length > 2) {
            return message.reply(`Uh oh! Looks like you gave too many arguments, please make sure to only give the required channel name and an optional member limit for the channel!\nExample: \`${prefix}tempvoice New Channel, 10\``);

        // If the user only gave one argument assign it as the channel name
        } else if(newArgs.length === 1) {
            // Create the temporary voice channel in the same category the server's afk channel is in
            message.guild.channels.create({name: `⏱️ ${name}`, type: Discord.ChannelType.GuildVoice, parent: message.guild.afkChannel.parent}).then((channel) => {
                // Move the newly created channel above the afk channel
                channel.setPosition(message.guild.afkChannel.position).then(() => {
                    
                    /* 
                    * Sync the model to the table
                    * Creates a new table if table doesn't exist, otherwise just inserts a new row
                    * id, active, createdAt, and updatedAt are set by default; DO NOT ADD
                    !!!!
                        Keep force set to false otherwise it will overwrite the table instead of making a new row!
                    !!!!
                    */
                    Models.tempchannel.sync({ force: false }).then(() => {
                        // Add the temp channel to the database
                        Models.tempchannel.create({
                            channel_id: channel.id,
                            user_id: message.author.id,
                            name: name,
                        })
                        // Let the user know it was added
                        .then(() => {

                            // Create the kicked embed
                            const tempChannelEmbed = {
                                color: 0x33CCFF,
                                title: `Temporary Channel Created!`,
                                author: {
                                    name: `${message.author.username}#${message.author.discriminator}`,
                                    icon_url: message.author.displayAvatarURL({dynamic:true}),
                                },
                                description: `${message.author} created a new temporary voice channel!`,
                                fields: [
                                    {
                                        name: `Channel Name`,
                                        value: `${name}`,
                                        inline: true,
                                    },
                                    {
                                        name: `User Limit`,
                                        value: "Unlimited",
                                        inline: true,
                                    },
                                ],
                                timestamp: new Date(),
                            };

                            // Send the embed to the action log channel
                            actionLog.send({embeds: [tempChannelEmbed]});
                        });
                    });
                });
            }).catch(console.error);

        // If the user gave two arguments then assign the first as the channel name and the second as the channel limit
        } else if (newArgs.length === 2) {
            // If the user limit given was less than 1 or greater than 99 let user know it is invalid
            if(isNaN(newArgs[1]) || newArgs[1] < 1 || newArgs[1] > 99) {
                return message.reply(`Uh oh! Looks like you tried to give me an invalid user limit, please provide me with a numerical limit that is between 1 and 99, or leave blank if no limit is needed!`);
            };

            // Create the temporary voice channel in the same category the server's afk channel is in with the user limit given
            message.guild.channels.create(`⏱️ ${name}`, {type: 'GUILD_VOICE', userLimit: newArgs[1], parent: message.guild.afkChannel.parent}).then(channel => {
                // Move the newly created channel above the afk channel
                channel.setPosition(message.guild.afkChannel.position -1, {relative: true}).then(() => {
                    /* 
                    * Sync the model to the table
                    * Creates a new table if table doesn't exist, otherwise just inserts a new row
                    * id, active, createdAt, and updatedAt are set by default; DO NOT ADD
                    !!!!
                        Keep force set to false otherwise it will overwrite the table instead of making a new row!
                    !!!!
                    */
                    Models.tempchannel.sync({ force: false }).then(() => {
                        // Add the temp channel to the database
                        Models.tempchannel.create({
                            channel_id: channel.id,
                            user_id: message.author.id,
                            name: name,
                            user_limit: newArgs[1],
                        })
                        // Let the user know it was added
                        .then(() => {

                            // Create the tempchannel embed
                            const tempChannelEmbed = {
                                color: 0x33CCFF,
                                title: `Temporary Channel Created!`,
                                author: {
                                    name: `${message.author.username}#${message.author.discriminator}`,
                                    icon_url: message.author.displayAvatarURL({dynamic:true}),
                                },
                                description: `${message.author} created a new temporary voice channel!`,
                                fields: [
                                    {
                                        name: `Channel Name`,
                                        value: `${name}`,
                                        inline: true,
                                    },
                                    {
                                        name: `User Limit`,
                                        value: `${newArgs[1]}`,
                                        inline: true,
                                    },
                                ],
                                timestamp: new Date(),
                            };

                            // Send the embed to the action log channel
                            actionLog.send({embeds: [tempChannelEmbed]});
                        });
                    });
                });
            });
        };
    },
    cmdToggleHandler: async function(interaction) {
        const command = interaction.client.commands.get(interaction.options.getString(`command`)); //get the command from the location collection

        // If the command exists
        if(command) {
            // Create string vars
            let currentState = ``;
            let newState = ``;
            let finalState = "";

            // Ensure the user isn't attempting to disable the cmdtoggle command
            if(command.name === "cmdtoggle") {
                return interaction.reply({content: `Well aren't you a silly one, you can't disable the command toggle command! 😝`, ephemeral: true});
            }

            // If the command is currently enabled
            if(command.enabled === true) {
                currentState = `enabled`; //current state of the command
                newState = `disable`; //action to take on the current state of the command
                finalState = "disabled"; //the state of the command once it has been changed
                startToggle(currentState, newState, finalState); //call the function to perform the toggle
            // If the command is currently disabled
            } else {
                currentState = `disabled`; //current state of the command
                newState = `enable`; //action to take on the current state of the command
                finalState = "enabled"; //the state of the command once it has been changed
                startToggle(currentState, newState, finalState); //call the function to perform the toggle
            }

            // Create a function to handle the toggle regardless of the current state
            function startToggle(c, n, f) {

                // Create the row of buttons
                const btns = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId(`yes`)
                            .setLabel(`Yes (Continue)`)
                            .setStyle(Discord.ButtonStyle.Success),
                        new Discord.ButtonBuilder()
                            .setCustomId(`no`)
                            .setLabel(`No (Abort)`)
                            .setStyle(Discord.ButtonStyle.Danger)
                    )

                // Send the response with the buttons to only the user who initiated the command
                interaction.reply({content: `The ${command.name} command is currently ${c}.\nAre you sure you want to ${n} this command?`, ephemeral: true, components: [btns], fetchReply: true})
                    .then(async (msg) => {

                        // Create the collector to capture the button clicks
                        const btnCollector = await msg.createMessageComponentCollector({componentType: Discord.ComponentType.Button, max:1,  time:15000});

                        // When a button is clicked
                        btnCollector.on(`collect`, i => {
                            // If the user agreed to continue
                            if(i.customId === "yes") {
                                let state = true; //the state to set it to

                                // If the command is enabled set the state var to false
                                if (c === `enabled`) {
                                    state = false;
                                };

                                toggleState(i, state);

                            // If the user wanted to abort
                            } else {
                                return i.reply({content: `${i.user},\nGot it! I have aborted this function. The ${command.name} is still ${c}.`, ephemeral: true});
                            }
                        })

                        // Once the interaction times out
                        btnCollector.on(`end`, collected => {

                            // If the user didn't click on one of the buttons let them know it timed out
                            if(collected.size === 0) {
                                interaction.channel.send(`My apologies ${interaction.user} but your previous interaction has timed out.\nThe command remains unchanged, please try again when you're ready!`);
                            }
                        })
                });

                // Function to handle updating the state of the command
                function toggleState(i, s) {
                    // Update the command in the local collection 
                    i.client.commands.set(command.name, {...command, enabled: s});

                    // Search for the command in the db
                    Models.command.findOne({where: {name:command.name}, raw:true}).then((cmd) => {

                        // If the command was found
                        if(cmd) {
                            // Update the command
                            Models.command.update({enabled: s}, {where: {name: cmd.name}});

                        // If the command wasn't found
                        } else {
                            // Add it to the db
                            Models.command.create({
                                name: command.name,
                                enabled: s,
                                mod: command.mod,
                                super: command.super,
                                admin: command.admin

                            });
                        }
                    });

                    // Let the user know the command has been changed
                    i.reply(`I have successfully ${finalState} the ${command.name} command!`)
                }
            }

        // If the command wasn't found, let the user know
        } else {
            return interaction.reply({content: `Uh oh! Looks like you are trying to update a command that doesn't exist, please try again!`, ephemeral: true})
        }
    },
    settingsHandler: async function(args, message, client) {
        const prefix = client.settings.get("prefix");
        const settingName = args[0].toLowerCase(); //make the setting name lowercase
        const adminChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("admin_channel_name")))); //get the admin channel 

        // Create the embed 
        let viewEmbed = new Discord.MessageEmbed()
            .setColor("ff5500") //orange color
            .setTitle(`Information on the ${settingName} setting`) //set the title
            .setTimestamp();

        // If the user wants to view all settings and their values
        if(args[0].toLowerCase() === "view" && args[1].toLowerCase() === "all") {

            // Find the settings from the db
            Models.setting.findAll({raw:true}).then(async (settings) => {
                // Make sure the settings were found
                if(settings) {

                    let embeds = []; //embeds array
                    
                    // Create a function to make a new embed
                    const createSettingsEmbed = () => new Discord.MessageEmbed()
                        .setTitle(`Settings`) //set the title
                        .setDescription(`These are all of the settings in the database. To make changes to them use \`${prefix}settings setting_name edit\` where \`setting_name\` is the name of the setting you wish to change`) //set the description
                        .setColor(`#00FF00`) //green color
                        .setTimestamp();

                    // Create a new message embed
                    let settingsEmbed = createSettingsEmbed();

                    let fieldCounter = 0; //field counter

                    settings.forEach((setting) => {
                        // Assign the last updated time
                        const lastUpdated = setting.updatedAt;

                        // Add the setting info fields
                        settingsEmbed.addFields(
                            {
                                name: `Name`, 
                                value: `${setting.name}`, 
                                inline: true,
                            },
                            {
                                name: `Value`,
                                value: `${setting.value}`,
                                inline: true,
                            },
                            {
                                name: `Last Update`,
                                value: `${Discord.Formatters.time(lastUpdated, "f")} (${Discord.Formatters.time(lastUpdated, "R")})`,
                                inline: true,
                            }
                        );

                        fieldCounter = fieldCounter + 3; //increment the counter by 3 for the above 3 fields added

                        // If there are more than 24 fields already in the embed then make a new one
                        if(fieldCounter >= 24) {

                            embeds.push(settingsEmbed); //push the message embed to the embeds array
                            settingsEmbed = createSettingsEmbed(); //create a new embed
                            fieldCounter = 0; //reset the field counter
                        }
                    });

                    // Push the final embed
                    if(fieldCounter !== 0) {
                        embeds.push(settingsEmbed);
                    }

                    const emojis = [`⬅️`, `➡️`]; //set the emojis to use

                    // Send the embed(s) with the embeds and emojis
                    await pagination({
                        author: message.author, //set the author
                        channel: adminChannel //send to the admin channel
                    }, embeds, emojis);
                }

            });

        // If the user wants to view or edit a specific setting
        } else if (args[1].toLowerCase() === "view") {

            // Find the setting in the db
            Models.setting.findOne({where: {name: settingName}, raw: true}).then((setting) => {
                // If a setting was found
                if(setting) {

                    // If the user is wanting to view a setting
                    if(args[1].toLowerCase() === "view") {

                        // Assign the last updated time
                        const lastUpdated = setting.updatedAt;

                        // Set the fields for the setting
                        viewEmbed.addFields(
                            {
                                name: "Name",
                                value: setting.name,
                                inline: false,
                            },
                            {
                                name: "Value",
                                value: `\`${setting.value}\``,
                                inline: false,
                            },
                            {
                                name: "Last Update",
                                value: `${Discord.Formatters.time(lastUpdated, "f")} (${Discord.Formatters.time(lastUpdated, "R")})`,
                                inline: false,
                            }
                        );

                        // Send the embed to the admin channel
                        adminChannel.send({embeds: [viewEmbed]});

                        // If the channel isn't the admin channel, let the user know it was sent
                        if(adminChannel.name !== message.channel.name) {
                            message.channel.send(`I have sent the data you requested to ${adminChannel}!`);
                        };
                    }
    
                // If no setting was found let the user know
                } else {
                    return message.reply(`Uh oh! Looks like I wasn't able to find that setting, please check your setting name and try again!\nYour input: \`${message.content}\``);
                }
            });

        // If user didn't use the command properly
        } else {
            message.reply(`Uh oh! It seems you entered an unaccepted argument, please use \`${prefix}help settings\` for help using this command!`);
        }
    }
}
