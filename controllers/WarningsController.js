// Import the required files
const Discord = require("discord.js");
const Warning = require("../models/Warning");

// Create a new module export
module.exports = {
    // Create a function with required args
    warningHandler: function(interaction) {
        //create vars
        let warnedUser, warnedChannel, fullMessage;
        const subcommand = interaction.options.getSubcommand();
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name"))));

        // If only 1 arg, make sure it is "recent"
        if (subcommand === `recent`) {
            // Get the count the user asked for
            const recentCount = interaction.options.getInteger(`amount`);

            // Get the most recent warnings
            Warning.findAll({limit:recentCount, order: [['createdAt', 'DESC']], raw:true}).then((data) => {

                // If warnings were found
                if (data) {
                    // If the table is empty then let the user know
                    if(data.length === 0) {
                        return interaction.reply({content: "There are currently no warnings in the database!", ephemeral: true});
                    }

                    let i = 1; // counter
                    // Create the embed
                    let recentEmbed = new Discord.EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Most Recent Warnings')
                    .setDescription(`These are the ${data.length} most recent warnings given.`)
                    .addFields({name: `**To get more info on a warning use /warnings specific {Warning Id}**`, value:'\u200b'})
                    .setTimestamp();

                    // Add a new field for each warning
                    data.forEach(warning => {
                        warnedUser = interaction.client.users.cache.get(warning.user_id.toString()); //get the user
                        let date = warning.createdAt; //set date

                        // Create a new field depending on the type of warning
                        if(warning.type === "Trigger") {
                            // Warning from a Trigger
                            recentEmbed.addFields({
                                name: `Warning #${i}`,
                                value: `Warning Id: **${warning.id}**\rUser: **${warnedUser || "\`Not In Server\`"}**\rType: **${warning.type}**\rDate: **${Discord.time(date, "D")} (${Discord.time(date, "R")})**\rSeverity: **${warning.severity}**\rTrigger(s): **${warning.triggers}**`
                            });
                        } else {
                            // Warning for all other types
                            recentEmbed.addFields({
                                name: `Warning #${i}`,
                                value: `Warning Id: **${warning.id}**\rUser: **${warnedUser || "\`Not In Server\`"}**\rType: **${warning.type}**\rDate: **${Discord.time(date, "D")} (${Discord.time(date, "R")})**`
                        });

                        }
                        i++; // increment counter
                    });

                    // If the user is in the action log
                    if(interaction.channel.id === actionLog.id) {
                        // Reply with the embed
                        interaction.reply({embeds: [recentEmbed]});

                    // If the user isn't in the action log
                    } else {
                        // Send the warnings to the action log channel
                        actionLog.send({embeds: [recentEmbed]}).then(() => {

                            // Reply in channel letting them know they've been messaged
                            interaction.reply({content: `I've sent a message containing the data you requested to ${actionLog}.`, ephemeral: true});
                        });
                    }
                };
            });

        } else if (subcommand === "specific") {
            // Get the warning id the user provided
            const warnId = interaction.options.getInteger(`id`);

            // Find the warning
            Warning.findOne({where: {id: warnId}, raw: true}).then((warning) => {

                // If a warning was found
                if (warning) {
                    guildUser = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(warning.user_id.toString()); //get the guild member
                    let embedColor = 0xff5500; // embed color; default to orange
                    let specificEmbed = new Discord.EmbedBuilder(); //create the embed

                    // If user IS in the guild
                    if(guildUser) {
                        // Assign values to the embed
                        specificEmbed.setTitle(`Information for warning #${warnId}`)
                        .setAuthor({name: guildUser.user.username, iconURL: guildUser.user.displayAvatarURL({dynamic:true})})
                        .addFields(
                            {name: `User Id`, value: guildUser.user.tag, inline: false},
                            {name: `User`, value: guildUser.toString(), inline: true},
                            {name: `Server Nickname`, value: `${guildUser.nickname || "None"}`, inline: true},
                            {name: `Warning Type`, value: warning.type, inline: true},
                            {name: `User Roles`, value: guildUser.roles.cache.map(role => role.name).join(", ")}
                        )
                        .setTimestamp();

                        // Call the fuction to define the type of warning
                        defineType();

                        // If the user is in the action log
                        if(actionLog.id === interaction.channel.id) {
                            // Reply with the embed
                            interaction.reply({embeds: [specificEmbed]});

                        // If the user isn't in the action log
                        } else {
                            // Send the embed to the action log
                            actionLog.send({embeds: [specificEmbed]}).then(() => {

                                // Let the user know the check the action log
                                interaction.reply({content: `I've sent a message containing the data you requested to ${actionLog}.`, ephemeral: true})
                            });
                        }
                    // If user is NOT in the guild
                    } else {
                        // Attempt to fetch the user
                        interaction.client.users.fetch(warning.user_id.toString()).then((usr) => {
                            // Assign values to the embed
                            specificEmbed.setTitle(`Information for warning #${warnId}`)
                            .setAuthor({name: usr.username, iconURL: usr.displayAvatarURL({dynamic:true})})
                            .addFields(
                                {name: `User Id`, value: `${usr.id}`, inline: true},
                                {name: '\u200B', value: '\u200B', inline: true},
                                {name: `User`, value: `${usr}`, inline: true},
                                {name: `Username (at time warned)`, value: `${warning.username || "Unknown"}`, inline: true},
                                {name: '\u200B', value: '\u200B', inline: true},
                                {name: `Warning Type`, value: `${warning.type}`, inline: true}
                            )
                            .setTimestamp();

                            // Call the fuction to define the type of warning
                            defineType();
                        }).then(() => {
                            // If the user is in the action log channel
                            if(actionLog.id === interaction.channel.id) {
                                // Reply with the embed
                                interaction.reply({embeds: [specificEmbed]});
                            // If the user isn't in the action log channel
                            } else {
                                // Send the embed to the action log
                                actionLog.send({embeds: [specificEmbed]}).then(() => {
                                    // Let the user know the check the action log
                                    interaction.reply({content: `I've sent a message containing the data you requested to ${actionLog}.`, ephemeral: true})
                                });
                            }
                        })
                    }
                    
                    // Create function to find the type of warning
                    function defineType() {
                        // If the warning is a trigger
                        if(warning.type === "Trigger") {
                            // Find the channel for the warning
                            warnedChannel = interaction.client.guilds.cache.get(interaction.guild.id).channels.cache.get(warning.channel_id);

                            // If the channel was deleted
                            if(!warnedChannel) {
                                warnedChannel = "`Deleted Channel`";
                            };

                            // Set the color of the embed based on severity level
                            switch(warning.severity) {
                                case 'low':
                                    embedColor = 0xffff00; //yellow
                                    break;
                                case 'medium':
                                    embedColor = 0xff5500; //orange
                                    break;
                                case 'high':
                                    embedColor = 0xff0000; //red
                                    break;
                            }

                            // Make sure message isn't too long for embed
                            if (warning.message.length > 1024) {
                                fullMessage = warning.message.substring(0, 1021) + "..."; // 1021 to add elipsis to end
                            } else {
                                fullMessage = warning.message;
                            }

                            // Add the color for the embed
                            specificEmbed.setColor(embedColor);

                            // Add the remaining fields
                            specificEmbed.addFields(
                                {name: `Trigger(s) Hit`, value: `${warning.triggers}`, inline: false},
                                {name: `Severity`, value: `${warning.severity}`, inline: false},
                                {name: `Channel`, value: `${warnedChannel.toString()}`, inline: false},
                                {name: `Time Trigger Was Hit`, value: `${Discord.time(warning.createdAt, "f")} (${Discord.time(warning.createdAt, "R")})`, inline: false},
                                {name: `Full Message`, value: `${fullMessage}`, inline: false},
                                {name: `Message URL`, value: `${warning.message_link}`, inline: false}
                                );
                        } else if(warning.type === "Note") {
                            // Find the moderator
                            moderator = interaction.client.guilds.cache.get(interaction.guild.id).members.cache.get(warning.mod_id.toString());

                            // Add the color for the embed
                            specificEmbed.setColor(embedColor);

                            // Add the remaining fields
                            specificEmbed.addFields(
                                {name: `Created By`, value: `${moderator}`, inline: true},
                                {name: `Date Warned`, value: `${Discord.time(warning.createdAt, "R")}`, inline: true},
                                {name: `Warning Reason`, value: `${warning.reason}`, inline: false}
                                );
                        }
                    }
                // If there was no warning for the provided warning id let the user know
                } else {
                    return interaction.reply({content: `Uh oh! I wasn't able to find the a warning with that warning id!\r If you think the warning exists, please check your warning id and try again!`, ephemeral: true});
                }
            }).catch((e) => {
                console.log(e)
                // If unable to find warning/user
                return interaction.reply({content: `Uh oh! I wasn't able to find the a warning with that warning id!\r If you think the warning exists, please check your warning id and try again!`, ephemeral: true});
            });
        } else if (args[0].toLowerCase() === "user") {

            if (args[1]) {
                // If the second argument is numeric only query the db based on user id
                if(args[1].match("^[0-9]+$")) {

                    Warning.findAll({where: {user_id: args[1]}, order: [['createdAt', 'DESC']], raw: true}).then((warnings) => {

                        // If a warning was found
                        if (warnings) {
                            // Call the sendUserWarnings function
                            sendUserWarnings(message, client, warnings);
                        }

                    }).catch((e) => {
                        return message.reply(`Uh oh! I either wasn't able to find the user with that id or that user has no warnings!\r If you think the user has warnings, please check your id and try again!`);
                    });

                // If the second argument starts with a tag query based on user mention
                } else if(args[1].startsWith("<@")) {
                    let userId = message.mentions.users.first().id;

                    // Find all warnings for the user's id
                    Warning.findAll({where: {user_id: userId}, order: [['createdAt', 'DESC']], raw: true}).then((warnings) => {
                        
                        // If a warning was found
                        if (warnings) {
                            // Call the sendUserWarnings function
                            sendUserWarnings(message, client, warnings);
                        }
                    }).catch((e) => {
                        return message.reply(`Uh oh! I either wasn't able to find the user with that id or that user has no warnings!\r If you think the user has warnings, please check your id and try again!`);
                    });
                } else {
                    return message.reply(`Uh oh! You seem to have provided an unacceptable user search method. Please ensure that you're searching by either user mention or id!`);
                }
            // If user forgot to give a username or id
            } else {
                return message.reply(`Uh oh! Looks like you forgot to tell me the user's id!\rExample: \`${prefix}warnings user {user_id}\``);
            }
        } else {
            return message.reply(`Uh oh! Looks like you didn't use that command properly, please check its' usage with \`${prefix}help warnings\``);
        }

        function sendUserWarnings(message, client, warnings) {
            // Find the warned user
            warnedUser = client.guilds.cache.get(message.guild.id).members.cache.get(warnings[0].user_id.toString());
            let i = 0;

            // Create the embed
            const userWarningsEmbed = new Discord.EmbedBuilder() 
                .setColor('#FF0000')
                .setTitle(`${warnedUser.user.username} has a total of ${Object.keys(warnings).length} warnings`)
                .setAuthor({name:`${warnedUser.user.username}`, iconURL: `${warnedUser.user.displayAvatarURL({dynamic:true})}`})
                .addFields(
                    {name: `User Id`, value:`${warnedUser.id}`},
                    {name: `User`, value: `${warnedUser}`, inline: true},
                    {name: `Server Nickname`, value: `${warnedUser.nickname || "None"}`, inline: true},
                    {name: `User Roles`, value: `${warnedUser.roles.cache.map(role => role.name).join(", ")}`}
                    )
                .setTimestamp()

                // If 21 or less warnings loop through them and add a field for each (Discord embeds are limited to 25 fields and we used 4 above)
                if (Object.keys(warnings).length < 21) {

                    // Loop through the warnings adding a new field for each one with the warning's id
                    warnings.forEach((warning) => {
                        userWarningsEmbed.addFields({name: `Warning`, value: `Warning Id: **${warning.warning_id}**`});
                    });

                // If more than 20 loop 20 times and then let user know there is more warnings
                } else {
                    
                    // Loop through the warnings
                    for (let warning of warnings) {

                        // Add up to 20 fields
                        if (i < 20) {
                            userWarningsEmbed.addFields({name: `Warning #${i+1}`, value: `${warning.warning_id}`});
                            i++; // increment counter

                        // If there are more than 21 let user know the remaining amount
                        } else {
                            //actionLog.send(`There are ${Object.keys(warnings).length - i} older warnings for this user!`);
                            userWarningsEmbed.setFooter(`There are ${Object.keys(warnings).length - i} older warnings for this user`);
                            break; // break the loop
                        }
                    }
                }
            
            // Send the data to the action log
            actionLog.send({embeds: [userWarningsEmbed]}).then(() => {
                // Don't send notification message if current channel is action log
                if(message.channel.id === actionLog.id) return;

                // Reply in the channel letting user know you sent the data to the action log
                message.reply(`I've sent a message containing the data you requested to ${actionLog}.`)
            });
        }
    }
}