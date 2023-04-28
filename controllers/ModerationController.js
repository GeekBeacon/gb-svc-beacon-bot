const moment = require("moment");
const Models = require("../models/AllModels");
const Discord = require('discord.js');
const TriggersController = require("./TriggersController");

module.exports = {
    deleteHandler: async function(m, c, deleteSet) {
        const message = m, client = c;
        const modLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        const superLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_log_channel_name")))); //super log channel
        let triggerArr = [];
        let triggerObj = {};
        let embedsArr = [];
        let embedCharCount = 0;



        // If deleted due to an unapproved url then ignore
        if(deleteSet.has(message.id)) {
            // Remove the message id from the set then ignore with return
            deleteSet.delete(message.id)
            return;
        }

        // Add each trigger word/phrase to the trigger array and populate the triggerObj with the trigger data
        client.triggers.forEach((trig, index) => {
            triggerArr.push(index);
            triggerObj[index] = trig;
        });


        // See if the message contains a trigger
        if(triggerArr.some(trigger => message.content.toLowerCase().match(`\\b${trigger}\\b`))) {
            // Store the trigger words
            let triggers = triggerArr.filter((trig) => message.content.toLowerCase().match(`\\b(${trig})\\b`));

            // Loop through all triggers in the message
            triggers.forEach((trigg) => {

                // If the trigger is high severity then return (don't send embed)
                if(triggerObj[trigg].severity === "high") {
                    return;
                }
            })
            
        } else {

            // Call the function to decide how to handle the embed(s)
            determineEmbeds();

            // If the edit was made in the super channel send to super logs
            if(message.channel.name.includes("master-control") || message.channel.name.includes("employees")) {

                // If the embeds count is 6000 characters or less
                if(embedCharCount <= 6000) {
                    // Send the embeds in a single message
                    await superLog.send({embeds: embedsArr});
                // If the embeds count is over 6000
                } else {
                    // Send the first two embeds (info andmessage)
                    await superLog.send({embeds: [embedsArr[0], embedsArr[1]]});
                };
            } else {
                
                // If the embeds count is 6000 characters or less
                if(embedCharCount <= 6000) {
                    // Send the embeds in a single message
                    await modLog.send({embeds: embedsArr});
                // If the embeds count is over 6000
                } else {
                    // Send the first two embeds (info and old message)
                    await modLog.send({embeds: [embedsArr[0], embedsArr[1]]});
                }
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
                // Call the removeFromDB function to update or create the user with 1 point value
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

        // Create a function for determining how to handle the delete log message
        function determineEmbeds() {
            
            // If the message can fit in the field value limit
            if(message.content.length <= 1024) {

                // Add the delEmbed data
                const delEmbed = new Discord.EmbedBuilder()
                .setColor(0x33ccff)
                .setTitle(`Message Deleted in ${message.channel.name}`)
                .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                .setDescription(`A message by ${message.author} was deleted in ${message.channel}`)
                .addFields(
                    {
                        name: "Message",
                        value: message.content || "`{Message was either an Embed or Image}`",
                        inline: false,
                    }
                )
                .setTimestamp();

                // Add the embed's character count to the embed count var
                embedCharCount += Discord.embedLength(delEmbed.data);

                // Add the embed to the array
                embedsArr.push(delEmbed);

            // If the messages can't fit within the field value limit
            } else {

                // Add the delEmbed data
                const delEmbed = new Discord.EmbedBuilder()
                .setColor(0x33ccff)
                .setTitle(`Message Deleted in ${message.channel.name}`)
                .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                .setDescription(`A message by ${message.author} was deleted in ${message.channel}`)
                .setTimestamp();

                // Add the embed's character count to the embed count var
                embedCharCount += Discord.embedLength(delEmbed.data);

                // Add the embed to the array
                embedsArr.push(delEmbed);

                // Create the old message's embed
                const msgEmbed = new Discord.EmbedBuilder()
                .setColor(0x33ccff)
                .setTitle(`Message`)
                .setDescription(message.content || "`{Message was either an Embed or Image}`");

                // Add the msgEmbed's character count to the embed count var
                embedCharCount += Discord.embedLength(msgEmbed.data);

                // Add the message embed to the array
                embedsArr.push(msgEmbed);
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
    editHandler: async function(o, n, c, deleteSet) {
        const oldMsg = o, newMsg = n, client = c; // create vars for parameter values
        const triggerList = client.triggers;
        const bannedUrls = client.blacklist;
        const superLog = newMsg.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_log_channel_name")))); //super log channel
        const modLog = newMsg.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        
        // Create vars
        const author = client.users.cache.get(newMsg.author.id);
        let bannedUrlArr = [];
        let triggerArr = [];
        let embedsArr = [];
        let embedCharCount = 0;

        // If pinned message or thread created then ignore
        if(oldMsg.pinned !== newMsg.pinned || oldMsg.hasThread !== newMsg.hasThread) {
            return;
        // If the message contains an embed
        } else if(newMsg.embeds.length) {
            // If the content (not embed) of the message is the same then ignore
            if(oldMsg.content === newMsg.content) {
                return;
            } else {
                determineEmbeds();
            }
        } else {
            determineEmbeds();
        }
        // If the edit was made in the super channel send to super logs
        if(newMsg.channel.name.includes("master-control") || newMsg.channel.name.includes("employees")) {

            // If the embeds count is 6000 characters or less
            if(embedCharCount <= 6000) {
                // Send the embeds in a single message
                await superLog.send({embeds: embedsArr});
            // If the embeds count is over 6000
            } else {
                // Send the first two embeds (info and old message)
                await superLog.send({embeds: [embedsArr[0], embedsArr[1]]}).then(async () => {
                    // Send the third embed (new message)
                    await superLog.send({embeds: [embedsArr[2]]});
                });
            };
        } else {
            
            // If the embeds count is 6000 characters or less
            if(embedCharCount <= 6000) {
                // Send the embeds in a single message
                await modLog.send({embeds: embedsArr}).then(() => {
                    // Call the function to check the new message
                    newMsgCheck();
                });
            // If the embeds count is over 6000
            } else {
                // Send the first two embeds (info and old message)
                await modLog.send({embeds: [embedsArr[0], embedsArr[1]]}).then(async () => {
                    // Send the third embed (new message)
                    await modLog.send({embeds: [embedsArr[2]]}).then(() => {
                        // Call the function to check the new message
                        newMsgCheck();
                    });
                });
            }
        }

        // Create a function to check the new message for disallowed content
        function newMsgCheck() {

            // Loop through the bannedUrl collection
            bannedUrls.forEach((domain) => {
                // Add each domain to the bannedUrlArr var
                bannedUrlArr.push(domain);
            });

            // Loop through the triggerList collection
            triggerList.forEach((value, trigger) => {
                // Add each trigger to the triggerArr var
                triggerArr.push(trigger);
            });

            if (newMsg.content.toLowerCase().match(/(?!w{1,}\.)(\w+\.?)([a-zA-Z0-9-]+)(\.\w+)/)) {
                // Get the excluded roles
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

                    // If not then call the handleUrl function from the module exports
                    module.exports.handleUrl(newMsg, client, regexMatch, deleteSet);
                };
            } else {
                // Get the excluded channel names
                const excludedChannels = client.settings.get("excluded_channels").split(",");

                // If the edit is in en excluded channel
                if(excludedChannels.some(c => newMsg.channel.name.includes(c))) {
                    return;

                } else {
                    // If there is no trigger then ignore
                    if(!triggerArr.some(trigger => newMsg.content.toLowerCase().match(`\\b${trigger}\\b`))) {
                        return;
                    // If there is a trigger than handle it
                    } else {

                        // Store the trigger words
                        const triggers = triggerArr.filter((trig) => newMsg.content.toLowerCase().match(`\\b(${trig})\\b`));

                        TriggersController.triggerHit(newMsg, triggers, client);
                    }
                }
            }
        }

        // Create a function for determining how to handle the edit log message
        function determineEmbeds() {
            
            // If the messages can fit in the field value limit
            if(oldMsg.content.length <= 1024 || newMsg.content.length <= 1024) {

                // Add the editEmbed data
                const editEmbed = new Discord.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle(`Message was edited in ${newMsg.channel.name}`)
                .setAuthor({name: `${author.username}#${author.discriminator}`, iconURL: author.displayAvatarURL({dynamic:true})})
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
                )
                .setTimestamp();

                // Add the embed's character count to the embed count var
                embedCharCount += Discord.embedLength(editEmbed.data);

                // Add the embed to the array
                embedsArr.push(editEmbed);

            // If the messages can't fit within the field value limit
            } else {

                // Create the starting embed
                const editEmbed = new Discord.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle(`Message was edited in ${newMsg.channel.name}`)
                .setAuthor({name: `${author.username}#${author.discriminator}`, iconURL: author.displayAvatarURL({dynamic:true})})
                .setDescription(`${newMsg.author} has edited a message in ${newMsg.channel} | [Jump To Message](${newMsg.url})`)
                .setTimestamp();

                // Add the embed's character count to the embed count var
                embedCharCount += Discord.embedLength(editEmbed.data);

                // Add the starting embed to the array
                embedsArr.push(editEmbed);

                // Create the old message's embed
                const oldMsgEmbed = new Discord.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle(`Original Message`)
                .setDescription(`${oldMsg.content || "*Unable to fetch original message*"}`);

                // Add the oldMsgEmbed's character count to the embed count var
                embedCharCount += Discord.embedLength(oldMsgEmbed.data);

                // Add the old message embed to the array
                embedsArr.push(oldMsgEmbed);

                // Create the new message's embed
                const newMsgEmbed = new Discord.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle(`New Message`)
                .setDescription(`${newMsg.content}`)

                // Add the newMsgEmbed's character count to the embed count var
                embedCharCount += Discord.embedLength(newMsgEmbed.data);

                // Add the new message embed to the array
                embedsArr.push(newMsgEmbed);
            }
        }
    },
    kickHandler: function(interaction) {
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const member = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(interaction.options.getUser(`user`).id); //get the member
        const reason = interaction.options.getString(`reason`); //get the reason

        // Get the mod+ roles
        const modTraineeRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("trainee_role_id"));
        const modRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("mod_role_id"));
        const superRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("admin_role_id"));

        // If member is a bot then deny kicking it
        if(member.user.bot) {
            return interaction.reply({content: `You can't kick no beep boop!`, ephemeral: true});

        // If the member tries to kick themselves then deny kicking them
        } else if(member.user.id === interaction.user.id) {
            return interaction.reply({content: `You can't kick yourself from the server, ya silly!`, ephemeral: true});

        // If the member is a mod+ then deny kicking them
        } else if(member.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name))) {
            return interaction.reply({content: `You got guts, trying to kick a ${member.roles.highest} member!`, ephemeral: true});

        // If the member is the server owner then deny kicking them
        } else if (member.user.id === interaction.guild.ownerId) {
            return interaction.reply({content: `I hope you didn't really think you could kick the server owner...`, ephemeral: true});
        }

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
                user_id: member.id,
                reason: reason,
                moderator_id: interaction.user.id,
            })
            // Let the mod know it was added
            .then(() => {

                // Create the kicked embed
                const kickEmbed = {
                    color: 0xFFA500,
                    title: `Member Was Kicked!`,
                    author: {
                        name: `${member.user.username}#${member.user.discriminator}`,
                        icon_url: `${member.user.displayAvatarURL({dynamic:true})}`,
                    },
                    description: `${member} was kicked from the server by ${interaction.member}`,
                    fields: [
                        {
                            name: `Member Kicked`,
                            value: `${member}`,
                            inline: true,
                        },
                        {
                            name: `Kicked By`,
                            value: `${interaction.member}`,
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
                    // Create a new warning
                    Models.warning.create({
                        user_id: member.id, // add the member's id
                        type: "Kicked", // assign the type of warning
                        reason: reason, // add the reason for the warning
                        username: member.user.username, // add the username
                        mod_id: interaction.user.id, // add the mod's id
                        nickname: member.nickname //add the nickname the member had
                    }).then(() => {

                        // Kick the member from the server
                        member.kick(reason).then(() => {
                            // Send the embed to the action log channel
                            actionLog.send({embeds: [kickEmbed]});

                            // Let mod know the member has been kicked
                            interaction.reply({content: `${member.user.username} was successfully kicked from the server!`, ephemeral: true});
                        });
                    });
                });
            })
        });
    },
    banHandler: async function(interaction) {

        // Get the mod's input
        const user = interaction.options.getUser(`user`); //user to ban
        const reason = interaction.options.getString(`reason`); //reason for banning
        let duration = interaction.options.getString(`duration`); //length of time to ban for
        let purge = interaction.options.getInteger(`purge`); //days to clear messages

        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        let bans, warnId, banId; //vars to be used
        let msgCleared = "No"; //bool for cleared messages

        // Get the mod+ roles
        const modTraineeRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("trainee_role_id"));
        const modRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("mod_role_id"));
        const superRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("admin_role_id"));

        // If the mod provided a purge amount
        if(purge) {
            // Set msgCleared if the mod provided a number > 0
            if(purge > 0) msgCleared = "Yes"; 

        // If no purge amount was given, set the amount to 0
        } else {
            purge = 0;
        }
        

        // See if the user is a member of the server
        const userAsMember = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(user.id.toString());

        // If the user is a member of the server
        if(userAsMember) {
            // If the user is a mod+ deny banning them
            if(userAsMember.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name))) {
                return interaction.reply({content: `You got guts, trying to ban a ${userAsMember.roles.highest} member!`, ephemeral: true});
            }
        }

        // If the user is a bot then deny banning it
        if(user.bot) {
            return interaction.reply({content: `You can't ban no beep boop!`, ephemeral: true});
        // If the user tries to ban themselves then deny banning them
        } else if(user.id === interaction.user.id) {
            return interaction.reply({content: `You can't ban yourself from the server, silly!`, ephemeral: true});
        // If the user is the server owner then deny banning them
        } else if (user.id === interaction.guild.ownerID) {
            return interaction.reply({content: `I hope you didn't really think you could ban the server owner...`, ephemeral: true});
        }

        // Get bans from the server
        bans = await interaction.guild.bans.fetch();

        // Check if the user is already banned
        if(bans.has(user.id)) {
            // If the user is already banned then let the mod know
            return interaction.reply({content: `You silly! ${user} is already banned!`, ephemeral: true});
        };

        let banValue = duration.replace(/\D+/, '').trim(); //assign the ban value
        let banUnit = duration.replace(/\d+/, '').trim(); //assign the ban unit
        const now = moment();
        const banLengthRegex = /(\d+\s*\D+$|^permanent$|^perma$|^perm$|^p{1}$){1}/; //regex for ban time format

        // Check if the mod input for a permanent ban
        if(banUnit.toLowerCase() === "perm") {
            banValue = 999; // assign value
            banUnit = `years`; // set unit
            duration = `an indefinite amount of time`; // set duration for description
        // If the mod input a duration shorter than 1 hour
        } else if (banUnit.toLowerCase().includes("min") || banUnit.toLowerCase().includes("sec") || banUnit === "s" || banUnit === "m") {
            return interaction.reply({content: `Please provide a ban time that is at least 1 hour long.`, ephemeral: true});
        // Check if the mod provided an accepted format
        } else if(!duration.match(banLengthRegex) || banValue < 1) {
            return interaction.reply({content: `Uh oh! It seems like you entered an invalue ban duration! Please use formats such as these for the ban duration: \`6 years\`, \`17d\`, \`permanent\`, \`3 wks\``, ephemeral: true})
        }

        let unbanDate = now.add(banValue, banUnit); //create the unban date

        // Make sure the unban date is after the current time
        if(moment(unbanDate).isAfter(now)) {
            // If not after the current time, let the mod know how to fix the problem
            return interaction.reply({content: `Uh oh! Looks like you have an invalid duration! Please try again with a proper unit of time and number duration!`, ephemeral: true});
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
                guild_id: interaction.guild.id,
                reason: reason,
                unban_date: unbanDate,
                moderator_id: interaction.user.id,
            })
            // Let the user know it was added
            .then((ban) => {

                // Assign the ban's id
                banId = ban.id;

                /* 
                * Sync the model to the table
                * Creates a new table if table doesn't exist, otherwise just inserts a new row
                * id, createdAt, and updatedAt are set by default; DO NOT ADD
                !!!!
                    Keep force set to false otherwise it will overwrite the table instead of making a new row!
                !!!!
                */
                Models.warning.sync({ force: false }).then(() => { 
                    // Create a new warning
                    Models.warning.create({
                        user_id: user.id, // add the user's id
                        type: "Banned", // assign the type of warning
                        reason: reason, // add the reason for the warning
                        username: user.username, // add the username
                        mod_id: interaction.user.id
                    }).then((warn) => {

                        // Assign the warning's id
                        warnId = warn.id;

                        // Make messages cleared string
                        msgCleared === "Yes" ? msgCleared = `Yes (Last ${purge} Days)` : msgCleared = `No`;

                        // Create the banned embed
                        const banEmbed = {
                            color: 0xFF0000,
                            title: `User Was Banned!`,
                            author: {
                                name: `${user.username}#${user.discriminator}`,
                                icon_url: user.displayAvatarURL({dynamic:true}),
                            },
                            description: `${user} was banned from the server by ${interaction.member} for ${duration}!`,
                            fields: [
                                {
                                    name: `User Banned`,
                                    value: `${user}`,
                                    inline: true,
                                },
                                {
                                    name: `Banned By`,
                                    value: `${interaction.member}`,
                                    inline: true,
                                },
                                {
                                    name: `Unban Date`,
                                    value: `${Discord.time(unbanDate.toDate(), "R")}`,
                                    inline: true,
                                },
                                {
                                    name: `Messages Cleared`,
                                    value: `${msgCleared}`,
                                    inline: true,
                                },
                                {
                                    name: `Ban Id`,
                                    value: `${banId}`,
                                    inline: true,
                                },
                                {
                                    name: `Warning Id`,
                                    value: `${warnId}`,
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

                        // Convert the days to seconds
                        purge = purge * 24 * 60 * 60;

                        // Ban the user from the server
                        interaction.guild.members.ban(user.id, {deleteMessageSeconds: purge, reason: reason}).then(() => {
                            // Send the embed to the action log channel
                            actionLog.send({embeds: [banEmbed]});
                            interaction.reply({content: `${user.username} was successfully banned for ${duration}!`, ephemeral: true})
                        });
                    });
                });
            });
        });
    },
    unbanHandler: async function(interaction) {
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const user = await interaction.client.users.fetch(interaction.options.getUser(`user`).id);
        const reason = interaction.options.getString(`reason`);

        // Fetch the ban from the server
        interaction.guild.bans.fetch(user).then(() => {
                        
            // Search the db for the ban
            Models.ban.findOne({where: {user_id: user.id, completed: 0}}).then((data) => {

                // Make sure data was retrieved
                if(data) {
                    const banDate = data.get(`createdAt`); //assign ban date
                    const banReason = data.get(`reason`); //assign ban reason
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
                            user_id: user.id,
                            reason: reason,
                            type: "Manual",
                            moderator_id: interaction.user.id,
                        })
                        // Let the user know it was added
                        .then(() => {

                            // Create the unban embed
                            const unbanEmbed = {
                                color: 0xFF5500,
                                title: `User Was Unbanned!`,
                                author: {
                                    name: `${user.username}#${user.discriminator}`,
                                    icon_url: `${user.displayAvatarURL({dynamic:true})}`,
                                },
                                description: `${user} was unbanned from the server by ${interaction.member}`,
                                fields: [
                                    {
                                        name: `User Unbanned`,
                                        value: `${user}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Unbanned By`,
                                        value: `${interaction.member}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Unban Reason`,
                                        value: `${reason}`,
                                        inline: false,
                                    },
                                    {
                                        name: `Ban Date`,
                                        value: `${Discord.time(banDate, "R")}`,
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
                            interaction.guild.members.unban(user.id).then(() => {

                                // Update the completed field for the ban
                                Models.ban.update({completed: 1}, {where: {user_id: user.id}});

                                // Send the embed to the action log channel
                                actionLog.send({embeds: [unbanEmbed]});

                                // Reply with a message
                                interaction.reply({content: `${user.username} was successfully unbanned!`});
                            });
                        });
                    });
                } else {
                    // If no data was found in the db
                    interaction.reply({content: `Uh oh, it looks like there is no information on this ban in the database!`, ephemeral: true})
                }
            });
        }).catch((e) => {
            // If no ban was found for that user
            return interaction.reply({content: `You silly! ${user} isn't banned!`, ephemeral: true})
        });
        
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
    timeoutHandler: function(interaction) {
        const member = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(interaction.options.getUser(`user`).id); //get the member
        const subcommand = interaction.options.getSubcommand(); //get the subcommand
        const reason = interaction.options.getString(`reason`); //get the reason
        const durationMin = interaction.options.getInteger(`duration`); //get the duration in minutes
        const durationMs = durationMin * 60000; //convert the duration to milliseconds
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        // Roles
        const modTraineeRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("trainee_role_id"));
        const modRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("mod_role_id"));
        const superRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("admin_role_id"));

        // If the mod wants to put a new member in timeout
        if(subcommand === "add") {
            // If the member is a bot then deny timing it out
            if (member.user.bot) {
                return interaction.reply({content: `You can't timeout no beep boop!`, ephemeral: true});
            // If the mod tries to timeout themselves then deny timing them out
            } else if (member.user.id === interaction.member.id) {
                return interaction.reply({content: `You can't timeout yourself, silly!`, ephemeral: true});
            // If the member is a mod+ then deny timing them out
            } else if (member.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name))) {
                return interaction.reply({content: `You got guts, trying to timeout a ${member.roles.highest} member!`, ephemeral: true});
            // If the user is the server owner then deny timing them out
            } else if (member.user.id === interaction.guild.ownerId) {
                return interaction.reply({content: `I hope you didn't really think you could timeout the server owner...`, ephemeral: true});
            }

            /* 
            * Sync the model to the table
            * Creates a new table if table doesn't exist, otherwise just inserts a new row
            * id, completed, createdAt, and updatedAt are set by default; DO NOT ADD
            !!!!
                Keep force set to false otherwise it will overwrite the table instead of making a new row!
            !!!!
            */
            Models.timeout.sync({force: false}).then(() => {

                // Timeout the member
                member.timeout(durationMs, reason).then((memb) => {

                    // Add the timeout record to the database
                    Models.timeout.create({
                        user_id: memb.id,
                        guild_id: interaction.guild.id,
                        reason: reason,
                        duration: durationMin,
                        end_date: memb.communicationDisabledUntil,
                        moderator_id: interaction.member.id,
                    }).then(() => {

                        // Create a warning
                        Models.warning.create({
                            type: "Timeout",
                            user_id: memb.id,
                            reason: reason,
                            mod_id: interaction.member.id,
                            username: memb.displayName,
                            timeout_end_date: memb.communicationDisabledUntil,
                        }).then(() => {

                            // Convert the time the timeout will release to a Discord Timestamp Markdown format
                            const relativeTimestamp = Discord.time(memb.communicationDisabledUntil, "R");

                            // Create the timeout embed
                            const timeoutEmbed = {
                                color: 0xFF0000,
                                title: `User Put In Timeout!`,
                                author: {
                                    name: `${member.user.username}#${member.user.discriminator}`,
                                    icon_url: `${member.user.displayAvatarURL({dynamic:true})}`,
                                },
                                description: `${member} was put in timeout by ${interaction.member} for ${durationMin} minute(s)!`,
                                fields: [
                                    {
                                        name: `Member`,
                                        value: `${member}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Timedout By`,
                                        value: `${interaction.member}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Duration`,
                                        value: `${durationMin} Minute(s)`,
                                        inline: true,
                                    },
                                    {
                                        name: `Communications Enabled`,
                                        value: `${relativeTimestamp}`,
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
                            // If the mod is in the actionlog, reply with the embed
                            if(interaction.channel.id === actionLog.id) {
                                interaction.reply({embeds: [timeoutEmbed]});

                            // If the user isn't in the actionlog, let them know the member was timedout
                            } else {
                                actionLog.send({embeds: [timeoutEmbed]});
                                interaction.reply({content: `${member.displayName} was successfully put in timeout for ${durationMin} minute(s)!`, ephemeral: true});
                            }
                        });
                    });
                });
            });
        // If the mod wants to remove a member from timeout
        } else if (subcommand === "remove") {

            // If the member isn't in timeout, let the mod know
            if(member.isCommunicationDisabled() === false) return interaction.reply({content: `Uh oh! It looks like ${member} isn't currently timedout!`, ephemeral: true});

            // Remove the member's timeout; set the duration to null
            member.timeout(null, reason).then(() => {

                // Create the timeout embed
                const timeoutEmbed = {
                    color: 0xFF0000,
                    title: `User Removed From Timeout!`,
                    author: {
                        name: `${member.user.username}#${member.user.discriminator}`,
                        icon_url: `${member.user.displayAvatarURL({dynamic:true})}`,
                    },
                    description: `${member} was removed from timeout by ${interaction.member}!`,
                    fields: [
                        {
                            name: `Member`,
                            value: `${member}`,
                            inline: true,
                        },
                        {
                            name: `Timedout By`,
                            value: `${interaction.member}`,
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
                // If the mod is in the actionlog, reply with the embed
                if(interaction.channel.id === actionLog.id) {
                    interaction.reply({embeds: [timeoutEmbed]});

                // If the user isn't in the actionlog, let them know the member was removed from timeout
                } else {
                    actionLog.send({embeds: [timeoutEmbed]});
                    interaction.reply({content: `${member.displayName} was successfully removed from timeout!`, ephemeral: true});
                }
            });
        }
    },
    blacklistHandler: function(interaction) {
        const subcommand = interaction.options.getSubcommand(); //get the subcommand
        const domain = interaction.options.getString(`domain`); //get the domain
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const ownerId = interaction.guild.ownerId; //get the owner's id
        // In role? Boolean
        const inSuperRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("super_role_id"));
        const inAdminRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("admin_role_id"));
        // Role vars
        const superRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("admin_role_id"));

        // List the domains
        if(subcommand === "list") {
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
                    // If the mod is in the actionlog channel, reply with the embed
                    if(interaction.channel.id === actionLog.id) {
                        interaction.reply({embeds: [blacklistsEmbed]});

                    // If the mod isn't in the actionlog channel let them know to check it
                    } else {
                        // Send the embed to the action log channel
                        actionLog.send({embeds: [blacklistsEmbed]});
                        // Let mod know the data was sent
                        return interaction.reply({content: `I've sent the data you requested to ${actionLog}`, ephemeral: true});
                    }
                    
                // If exceeded the character limit let user know
                } catch(e) {
                    return interaction.reply({content: `There are too many domains to display currently! Please ask Kankuro for the list if you require it!`, ephemeral: true});
                }
            })
        
        // Add a domain
        } else if (subcommand === "add") {

            // Regex for ensuring valid url
            const domainRegEx = /^(?:https?\:\/\/)?(?:.+\.)?([A-Za-z0-9-]+\.\w+)(?:\/?[^\s]+)?$/g;

            // If only one domain was given and it doesn't match the regex let user know
            if(!domain.match(domainRegEx)) {
                return interaction.reply({content: `${domain} was an invalid url/domain, please try again!`, ephemeral: true});
            }

            /* 
            * Sync the model to the table
            * Creates a new table if table doesn't exist, otherwise just inserts a new row
            * id, createdAt, and updatedAt are set by default; DO NOT ADD
            !!!!
                Keep force set to false otherwise it will overwrite the table instead of making a new row!
            !!!!
            */
            Models.bannedurl.sync({force: false}).then(() => {

                // See the the domain is already in the db
                Models.bannedurl.findOne({where: {url: domain}}).then((item) => {
                    // If the domain is already blacklisted, let the mod know
                    if(item) {
                        return interaction.reply({content: `Uh oh! Looks like ${domain} is already in the domain blacklist!`, ephemeral: true});
                    // If the domain isn't in the db, add it
                    } else {

                        // Strip the url to only get the domain name and tld (and sub domains)
                        const newDomain = domain.replace(/(https?:\/\/(w+\.)?|\/(.+)?)/g, "");

                        // Add the domain to the database
                        Models.bannedurl.create({
                            url: newDomain,
                            added_by: interaction.member.id,
                        }).then((item) => {

                            // Create the embed
                            const blacklistEmbed = {
                                color: 0x00FF00,
                                title: `Domain Blacklist Added`,
                                author: {
                                    name: `${interaction.user.tag}`,
                                    icon_url: `${interaction.member.displayAvatarURL({dynamic: true})}`,
                                },
                                description: `${interaction.member.displayName} has blacklisted a new domain!`,
                                fields: [
                                    {
                                        name: `Domain Added`,
                                        value: `${newDomain}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Added By`,
                                        value: `${interaction.member}`,
                                        inline: true,
                                    }, 
                                ],
                                timestamp: new Date()
                            }

                            // Add the url to the blacklist
                            interaction.client.blacklist.set(item.id, newDomain);

                            // If the mod is in the actionlog, reply with the embed
                            if(interaction.channel.id === actionLog.id) {
                                interaction.reply({embeds: [blacklistEmbed]});

                            // If the mod isn't in the actionlog, let them know to check it
                            } else {
                                // Send the embed to the action log channel
                                actionLog.send({embeds: [blacklistEmbed]});
                                // Let the mod know the domain was added
                                interaction.reply({content: `${newDomain} was successfully added to the list of banned domains!`, ephemeral: true});
                            }
                        })
                    }
                });
            });
        
        // Remove a domain
        } else if (subcommand === "remove") {
            // Make sure user is a super or higher role
            if(!inSuperRole && !inAdminRole && interaction.guild.ownerId !== ownerId) {
                // If not let them know to ask a super or higher to remove the domain
                return interaction.reply({content: `Uh oh! You aren't allowed to remove blacklisted domains, if you feel this domain should be removed please ask a ${superRole} or ${adminRole} to delete it!`, ephemeral: true});
            }
            // Regex for ensuring valid url
            const domainRegEx = /^(?:https?\:\/\/)?(?:.+\.)?([A-Za-z0-9-]+\.\w+)(?:\/?[^\s]+)?$/g;

            // If the domain doesn't match the regex let user know
            if(!domain.match(domainRegEx)) {
                return interaction.reply({content: `${domain} was an invalid url/domain, please try again!`, ephemeral: true});
            }

            // Strip the url to only get the domain name and tld (and sub domains)
            const newDomain = domain.replace(/(https?:\/\/(w+\.)?|\/(.+)?)/g, "");

            // Query the database for the domain passed in
            Models.bannedurl.findOne({where: {url: newDomain}}).then((item) => {
                // If the domain was found, then remove it
                if (item) {
                    Models.bannedurl.destroy({
                        where: {
                            url: newDomain
                        }
                    // Let the user know it was removed
                    }).then(() => {

                        // Create the embed
                        const blacklistEmbed = {
                            color: 0x00FF00,
                            title: `Domain Blacklist Removed`,
                            author: {
                                name: `${interaction.user.tag}`,
                                icon_url: `${interaction.member.displayAvatarURL({dynamic: true})}`,
                            },
                            description: `${interaction.member.displayName} has removed a domain from the blacklist!`,
                            fields: [
                                {
                                    name: `Domain Removed`,
                                    value: `${newDomain}`,
                                    inline: true,
                                },
                                {
                                    name: `Removed By`,
                                    value: `${interaction.member}`,
                                    inline: true,
                                }, 
                            ],
                            timestamp: new Date()
                        }

                        // Reomve the bannedUrl from the local collection
                        interaction.client.blacklist.delete(item.id);

                        // If the mod is in the actionlog, reply with the embed
                        if(interaction.channel.id === actionLog.id) {
                            interaction.reply({embeds: [blacklistEmbed]});

                        // If the mod is not in the actionlog, let them know to check it
                        } else {
                            actionLog.send({embeds: [blacklistEmbed]});
                            // Let user know domain was removed
                            interaction.reply({content: `I have successfully removed \`${newDomain}\` from the blacklisted domains!`, ephemeral: true});
                        }
                    });
                // If the domain wasn't found let the mod know
                } else {
                    return interaction.reply({content: `Unable to find \`${newDomain}\`, please try again or use \`/blacklist list\` to view all blacklisted domains!`, ephemeral: true});
                };
            });
        }
    },
    handleUrl: async function(m, c, rm, deleteSet) {
        const message = m, client = c, regexMatch = rm;
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        let embedArr = [];

        // Add the message id to the deleteSet
        deleteSet.add(message.id);

        // Check if the message can fit within the field value character limit
        if(regexMatch.input.length <= 1024) {
            // Create the embed
            const urlEmbed = new Discord.EmbedBuilder()
                .setColor(0xff5500)
                .setTitle(`Message Deleted in ${message.channel.name}`)
                .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                .setDescription(`I have deleted a message by ${message.author} in ${message.channel} because it contained a link that is blacklisted!`)
                .addFields(
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
                )
                .setTimestamp();

                // Add the embed to the array
                embedArr.push(urlEmbed);

            // If the message is too big for the field value
        } else {
            // Create the embed for the information
            const urlEmbed = new Discord.EmbedBuilder()
                .setColor(0xff5500)
                .setTitle(`Message Deleted in ${message.channel.name}`)
                .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                .setDescription(`I have deleted a message by ${message.author} in ${message.channel} because it contained a link that is blacklisted!`)
                .addFields(
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
                    }
                )
                .setTimestamp();

                // Add the embed to the array
                embedArr.push(urlEmbed);

            // Create the second embed for the message
            const msgEmbed = new Discord.EmbedBuilder()
            .setColor(0xff5500)
            .setTitle(`Message`)
            .setDescription(`${regexMatch.input}`);

            // Add the embed to the array
            embedArr.push(msgEmbed);

        }

        // Send the embed to the mod log
        await actionLog.send({embeds: embedArr}).then((msg) => {
            
            // Create a new table if one doesn't exist; force: false to prevent overwrite; alter: true to make the table match the model
            Models.warning.sync({ force: false, alter: true }).then(() => {
                // Store the data
                Models.warning.create({
                    user_id: message.author.id, // add the user's id
                    type: "Banned URL", // assign the type of warning
                    username: message.author.username.toLowerCase(), // add the user's username
                    nickname: message.member.nickname, // add the member's nickname
                    message: regexMatch.input, // add the full message
                    message_link: msg.url, // add the message url
                    banned_url: regexMatch[0], // add the banned url
                    channel_id: message.channel.id // add the channel's id
                })
            });

            // Delete the message with a reason
            message.delete({reason: "Blacklisted URL"}).then(() => {

                // Let the user know why their message was deleted
                message.channel.send(`${message.member.displayName}, we do not allow that website to be shared on our Discord, please refrain from posting links to that website!`);
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
    listBans: function(interaction) {
        // Get the action log channel
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name"))));
        const subcommand = interaction.options.getSubcommand(); //get the subcommand

        // If the recent subcommand was given
        if(subcommand === "recent") {
            // Create embed with basic fields
            const bansEmbed = new Discord.EmbedBuilder()
                .setColor(`#33ccff`)
                .setTitle(`Recent Bans`)
                .setDescription(`This is basic information on the last 10 bans, for more detailed information pass in the ban's id with the \`\`specific\`\` subcommand.\n**Example:** \`/bans specific:1\``)
                .setTimestamp()

            // Get 10 bans ordering them by createdAt date
            Models.ban.findAll({limit:10, order:[["createdAt", "DESC"]]}).then(async (data) => {
                // Make sure there is data
                if(data) {
                    // Loop through the data
                    for(i=0; i < data.length; i++) {
                        // Assign the current ban to a var
                        const ban = data[i];
                        // Find the user
                        const user = await interaction.client.users.fetch(ban.get(`user_id`));
                        let banned;

                        // Assign the value of banned or not based on the boolean
                        if(ban.get(`completed`) === 1) {
                            banned = `No`;
                        } else {
                            banned = `Yes`;
                        };

                        // Add the data for the banned user to the embed
                        bansEmbed.addFields({ name: `\u200B`, value: `**ID:** ${ban.get("id")}\n**User:** ${user.tag}\n**Still Banned:** ${banned}`, inline: false});
                    }
                }
            }).then(() => {
                // If the mod is in the mod log, reply with the embed
                if(interaction.channel.id === actionLog.id) {
                    interaction.reply({embeds: [bansEmbed]});

                // If the mod is not in the mod log, let them know to check it
                } else {
                    // Send the embed to the mod log
                    actionLog.send({embeds: [bansEmbed]});
                    // Let the user know the information was sent to the action log channel
                    interaction.reply({content: `I've sent the data to the ${actionLog} channel`, ephemeral: true});
                }
            })
        // If an argument was given
        } else {

            // Search the database for the requested ban id
            Models.ban.findOne({where:{id: interaction.options.getInteger(`id`)}}).then(async (ban) => {
                // Make sure there is data for the ban
                if(ban) {
                    // Find the user and mod
                    const user = await interaction.client.users.fetch(ban.get(`user_id`));
                    const mod = await interaction.client.users.fetch(ban.get(`moderator_id`));
                    let completed;

                    // Assign the value for completed based on the boolean
                    if(ban.get(`completed`) === 1) {
                        completed = "Yes";
                    } else {
                        completed = "No";
                    }

                    // Create the embed
                    const banEmbed = {
                        color: 0x33ccff,
                        title: `Ban #${ban.get(`id`)}`,
                        author: {
                            name: `${user.tag}`,
                            icon_url: `${user.displayAvatarURL({dynamic: true})}`,
                        },
                        fields: [
                            {
                                name: `Id`,
                                value: `${ban.get("id")}`,
                                inline: true
                            },
                            {
                                name: `User`,
                                value: `${user}`,
                                inline: true
                            },
                            {
                                name: `Completed`,
                                value: `${completed}`,
                                inline: true
                            },
                            {
                                name: `Moderator`,
                                value: `${mod}`,
                                inline: true
                            },
                            {
                                name: `Date Banned`,
                                value: `${Discord.time(ban.createdAt, "R")}`,
                                inline: true
                            },
                            {
                                name: `Unban Date`,
                                value: `${Discord.time(ban.unban_date, "R")}`,
                                inline: true
                            },
                            {
                                name: `Reason`,
                                value: `${ban.get("reason")}`,
                                inline: false
                            }
                        ],
                        timestamp: new Date()
                    }

                    // If the mod is in the mod log channel, reply with the embed
                    if(interaction.channel.id === actionLog.id) {
                        interaction.reply({embeds: [banEmbed]});

                    // If the mod isn't in the mod log, let them know to check it
                    } else {
                        // Send the embed to the action log channel
                        actionLog.send({embeds: [banEmbed]});
                        // Let the user know the information was sent to the action log channel
                        interaction.reply({content: `I've sent the data to the ${actionLog} channel`, ephemeral: true});
                    }
                }
            }).catch((e) => {
                interaction.reply({content: `Uh oh! It seems the id you provided isn't in the database!`, ephemeral: true});
            })
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

            let replyString; //message to reply with
            
            // If the member's nickname was reset
            if(subcommand === `reset`) {
                replyString = `Done! ${member.user.username}'s nickname has been reset!`;

            // If the member's nickname was changed
            } else {
                replyString = `Done! ${member.user.username}'s nickname is now \`${newNick}\`!`;
            }

            // Let the mod know the member's nickname was changed
            interaction.reply({content: replyString, ephemeral: true});

        // If unable to change the member's nickname let the moderator know
        }).catch(e => {
            interaction.reply({content: `Uh oh! It seems I'm not able to change that member's nickname, most likely due to permissions!`, ephemeral: true})
        });
        
    },
    tempVoiceHandler: function(interaction) {
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const name = interaction.options.getString(`name`).split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' '); //caps the first letter of each word in the name
        const userLimit = interaction.options.getInteger(`limit`);

        if(userLimit == null) {
            // Create the temporary voice channel in the same category the server's afk channel is in
            interaction.guild.channels.create({name: `⏱️ ${name}`, type: Discord.ChannelType.GuildVoice , parent: interaction.guild.afkChannel.parent}).then((channel) => {
                // Move the newly created channel above the afk channel
                channel.setPosition(interaction.guild.afkChannel.position).then(() => {
                    
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
                            user_id: interaction.user.id,
                            name: name,
                        })
                        // Let the user know it was added
                        .then(() => {

                            // Create the kicked embed
                            const tempChannelEmbed = {
                                color: 0x33CCFF,
                                title: `Temporary Channel Created!`,
                                author: {
                                    name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                    icon_url: `${interaction.user.displayAvatarURL({dynamic:true})}`,
                                },
                                description: `${interaction.member} created a new temporary voice channel!`,
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

                            // Let the member know the channel was made
                            interaction.reply({content: `The channel, <#${channel.id}>, was made successfully!`, ephemeral: true});

                        });
                    });
                });
            });

        // If the member provided a member limit, set that
        } else {

            // Create the temporary voice channel in the same category the server's afk channel is in with the member limit given
            interaction.guild.channels.create({name:`⏱️ ${name}`, type: Discord.ChannelType.GuildVoice, userLimit: userLimit, parent: interaction.guild.afkChannel.parent}).then(channel => {
                // Move the newly created channel above the afk channel
                channel.setPosition(interaction.guild.afkChannel.position).then(() => {
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
                            user_id: interaction.member.id,
                            name: name,
                            user_limit: userLimit,
                        })
                        // Let the member know it was added
                        .then(() => {

                            // Create the tempchannel embed
                            const tempChannelEmbed = {
                                color: 0x33CCFF,
                                title: `Temporary Channel Created!`,
                                author: {
                                    name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                    icon_url: `${interaction.user.displayAvatarURL({dynamic:true})}`,
                                },
                                description: `${interaction.member} created a new temporary voice channel!`,
                                fields: [
                                    {
                                        name: `Channel Name`,
                                        value: `${name}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Member Limit`,
                                        value: `${userLimit}`,
                                        inline: true,
                                    },
                                ],
                                timestamp: new Date(),
                            };

                            // Send the embed to the action log channel
                            actionLog.send({embeds: [tempChannelEmbed]});

                            // Let the member know the channel was made
                            interaction.reply({content: `The channel, <#${channel.id}> (Limit: ${userLimit}), was made successfully!`, ephemeral: true});
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
    }
}
