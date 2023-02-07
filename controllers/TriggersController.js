// Import the required files
const moment = require('moment');
const Models = require("../models/AllModels");
const shortid = require('shortid');
const { get } = require('lodash');

// Create a new module export
module.exports = {
    // Create a function with required args
    triggerHandler: function(interaction, triggerList) {
        // Create vars
        let trigger = interaction.options.getString(`trigger`);
        const triggerAction = interaction.options.getSubcommand()
        const modRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("mod_role_id"));
        const superRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("admin_role_id"));
        const ownerRole = interaction.member.guild.owner;
        const modChannel = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_channel_name"))));

        /*********** LIST TRIGGERS ***********/
        if (triggerAction === 'list') {

            // If user is a mod+ then list triggers
            if ((modRole || superRole || adminRole || interaction.member === ownerRole)) {
                let enabledTriggers = [];
                let disabledTriggers = [];

                // Get all rows and add their trigger word/phrase to the correct triggers array
                Models.trigger.findAll().then((data) => {
                    data.forEach((item) => {
                        // If the trigger is enabled add it to the enabledTriggers array
                        if(item.get(`enabled`) == true) {
                            enabledTriggers.push(item.get('trigger'));
                        // If the trigger is disabled add it to the disabledTriggers array
                        } else if (item.get(`enabled`) == false) {
                            disabledTriggers.push(item.get(`trigger`))
                        }
                    });
                // Send the triggers to the user
                }).then(() => {
                    if (enabledTriggers.length || disabledTriggers) {
                        interaction.reply({content: `**Enabled triggers:** ${enabledTriggers.map(trigger => `\`${trigger}\``).join(', ') || "None"}\n\n**Disabled triggers:** ${disabledTriggers.map(trigger => `\`${trigger}\``).join(', ') || "None"}`, ephemeral: true});
                    // If there are no triggers let the user know
                    } else {
                        interaction.reply({content: "Uh oh! It seems there aren't any triggers yet!", ephemeral: true});
                    }
                });
            }
        /*********** ADD TRIGGER ***********/
        } else if (triggerAction === 'add') {
            const severity = interaction.options.getString(`severity`) //severity level

            /* 
            * Sync the model to the table
            * Creates a new table if table doesn't exist, otherwise just inserts a new row
            * id, createdAt, and updatedAt are set by default; DO NOT ADD
            * Since default is set for enabled above, no need to add
            !!!!
                Keep force set to false otherwise it will overwrite the table instead of making a new row!
            !!!!
            */
            Models.trigger.sync({ force: false }).then(() => {
                // Query the database for the trigger
                Models.trigger.findOne({where:{trigger: trigger}}).then((trig) => {
                    // If there is no trigger add it
                    if (!trig) {
                        Models.trigger.create({
                            trigger: trigger, // add the trigger string to the trigger column
                            user_id: interaction.member.id, // add the creator's id
                            severity: severity
                        })
                        // Let the user know it was added
                        .then(() => {
                            interaction.reply(`I have successfully added \`${trigger}\` to the trigger list!`);

                            // Create the object for the trigger's values
                            const triggerValues = {"severity":severity, "enabled":1};
                            // Add trigger to the local triggers collection
                            interaction.client.triggers.set(trigger, triggerValues);
                        });
                    // If there was a trigger, let user know it exists already
                    } else {
                        interaction.reply({content: `It looks like \`${trigger}\` has already been added to the trigger list!`, ephemeral: true});
                    }
                });
            });
            

        /*********** REMOVE TRIGGER ***********/
        } else if (triggerAction === 'remove') {
            // Query the database for the trigger passed in
            Models.trigger.findOne({where: {trigger: trigger}}).then((trig) => {
                // If the trigger was found, then remove it
                if (trig) {
                    Models.trigger.destroy({
                        where: {
                            trigger: trigger
                        }
                    // Let the user know it was removed
                    }).then(() => {

                        // Remove the trigger from the trigger collection
                        interaction.client.triggers.delete(trigger);
                        

                       interaction.reply(`I have successfully removed \`${trigger}\` from the trigger list!`);
                    });
                // If the trigger wasn't found let the user know
                } else {
                   interaction.reply({content: `Unable to find \`${trigger}\`, please try again or use \`/triggers list\` to view all triggers!`, ephemeral:true});
                };
            });

        /*********** ENABLE TRIGGER ***********/
        } else if (triggerAction === 'enable') {
            // Find the trigger
            Models.trigger.findOne({where: {trigger: trigger}}).then((trig) => {
                //If the trigger was found...
                if (trig) {
                    // Check if the trigger is already enabled
                    if (trig.enabled === false) {
                        // If not then enable it and let user know
                        trig.update({
                            enabled: true
                        }).then(() => {
                            // Assign the trigger's local collection values
                            const triggerValues = {"severity":trig.severity, "enabled":1}
                            // Update the local collection trigger's values
                            interaction.client.triggers.set(trigger,triggerValues)

                            interaction.reply(`I have successfully enabled \`${trigger}\`!`);
                        });
                    // If already enabled let user know
                    } else {
                        interaction.reply({content:`It looks like \`${trigger}\` is already enabled!`, ephemeral:true});
                    };
                // If the trigger wasn't found let the user know
                } else {
                    interaction.reply({content: `Unable to find \`${trigger}\`, please try again or use \`/triggers list\` to view all triggers!`, ephemeral:true});
                };
            });

        /*********** DISABLE TRIGGER ***********/
        } else if (triggerAction === 'disable') {
            // Find the trigger
            Models.trigger.findOne({where: {trigger: trigger}}).then((trig) => {
                //If the trigger was found...
                if (trig) {
                    // Check if the trigger is already disabled
                    if (trig.enabled === true) {
                        // If not then disable it and let user know
                        trig.update({
                            enabled: false
                        }).then(() => {
                            // Assign the trigger's local collection values
                            const triggerValues = {"severity":trig.severity, "enabled":0}
                            // Update the local collection trigger's values
                            interaction.client.triggers.set(trigger,triggerValues)

                            interaction.reply(`I have successfully disabled \`${trigger}\`!`);
                        });
                    // If already disabled let user know
                    } else {
                        interaction.reply({content:`It looks like \`${trigger}\` is already disabled!`, ephemeral:true});
                    };
                // If the trigger wasn't found let the user know
                } else {
                    interaction.reply({content: `Unable to find \`${trigger}\`, please try again or use \`/triggers list\` to view all triggers!`, ephemeral:true});
                };
            });
        };
    },
    triggerHit: function(m, t, c) {
        // Create vars
        const message = m, triggers = t, client = c;
        const prefix = client.settings.get("prefix");
        let severity, fullMessage;
        
        let warnId = shortid.generate(); // generate a uid
        let severityArr = [];
        const modRole = message.member.roles.cache.find(role => role.id === client.settings.get("mod_role_id"));
        const modTraineeRole = message.member.roles.cache.find(role => role.id === client.settings.get("trainee_role_id"));
        const superRole = message.member.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.member.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));

        // Find the trigger(s) in the database
        Models.trigger.findAll({where: {trigger: triggers},raw:true}).then((data) => {
            //If the trigger(s) were found...
            if (data) {
                // Loop through returned data matches and add severities to array
                for(let i = 0; i < data.length; i++) {
                    severityArr.push(data[i].severity);
                }
            }
        }).then(() => {

            // Find the highest severity level hit and assign it as the severity level
            if (severityArr.includes('high')) {
                severity = "high";
            } else if(severityArr.includes('medium')) {
                severity = "medium";
            } else if (severityArr.includes('low')) {
                severity = "low";
            }

            // Create a new table if one doesn't exist
            Models.warning.sync({ force: false }).then(() => {

                Models.warning.findOne({where: {warning_id: warnId}, raw:true}).then((warning => {
                    if(warning) {
                        if(warning.warning_id === warnId) {
                            warnId = shortid.generate();
                        }
                    }
                })).then(() => {
                    // Store the data
                    Models.warning.create({
                        warning_id: warnId, // add the warning Id
                        user_id: message.author.id, // add the user's id
                        type: "Trigger", // assign the type of warning
                        username: message.author.username.toLowerCase(), // add the user's username
                        triggers: triggers.join(", "), // join the trigger array and add them
                        message: message.content, // add the full message
                        message_link: message.url, // add the message url
                        severity: severity, // add the severity level
                        channel_id: message.channel.id // add the channel's id
                    })
                    // Warn the user and let the moderators know
                    .then(() => {

                        // Make sure full message isn't too large for embed field
                        if(message.content.length > 1024) {
                            fullMessage = message.content.substring(0, 1021) + "..."; // 1021 to add elipsis at end
                        } else {
                            fullMessage = message.content;
                        }

                        // Create the embed
                        const embedMsg = {
                            color: 0x00FF00, // this will change based on severity
                            title: "A User Has Hit A Trigger!",
                            author: {
                                name: `${message.author.username}#${message.author.discriminator}`,
                                icon_url: message.author.displayAvatarURL({dynamic:true}),
                            },
                            description: `${message.author} has been warned for saying a trigger!`,
                            fields: [
                                {
                                    name: "Severity",
                                    value: severity,
                                    inline: true,
                                },
                                {
                                    name: "Channel",
                                    value: `${message.channel}`,
                                    inline: true,
                                },
                                {
                                    name: "Get More Info",
                                    value: `${prefix}warnings specific ${warnId}`,
                                },
                                {
                                    name: "Full Message From User",
                                    value: fullMessage,
                                },
                                {
                                    name: "Message URL",
                                    value: message.url,
                                },
                            ],
                            timestamp: new Date(),
                        }

                        switch(severity) {
                            case "high":
                                handleHigh(triggers, embedMsg);
                                break;
                            case "medium":
                                handleMedium(triggers, embedMsg);
                                break;
                            case "low":
                                handlelow(triggers, embedMsg);
                                break;
                        }
                    });
                });
            });
        });

        // Handle the high severity trigger(s)
        function handleHigh(t, e) {
            // Set the color for the embed
            e.color = 0xFF0000; // red since high severity

            // Set description for high severity urgency
            e.description = `A message by ${message.author} has been warned for saying a trigger, further action is required!`

            // Call reportLadder function
            reportLadder(t, e);
        }

        // Handle the medium severity trigger(s)
        function handleMedium(t, e) {
            // Set the color for the embed
            e.color = 0xFFA500; // orange since medium severity

            // Set description for medium severity urgency
            e.description = `A message by ${message.author} has been warned for saying a trigger, further action may be required!`

            // Call reportLadder function
            reportLadder(t, e);
        }

        // Handle the low severity trigger(s)
        function handlelow(t, e) {
            // Set the color for the embed
            e.color = 0x00FF00; // green since low severity

            // Call reportLadder function
            reportLadder(t, e);
        }

        // Sends reports of triggers based on user's permissions and the existence of specific channels
        function reportLadder(t, e) {
            const superChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_channel_name")))); //super channel
            const adminChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("admin_channel_name")))); //admin channel
            const superLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_log_channel_name")))); //super log channel
            const logChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //action log channel
            // Gets the guildMember instance of the user so we can get more information on them and their information within our server.
            warnedUser = client.guilds.cache.get(message.guild.id).members.cache.get(message.author.id);

            // Create deleted message embed for action log for high severity triggers
            const delMsgEmbed = {
                color: 0xFF0000,
                title: `Trigger Message Deleted!`,
                author: {
                    name: `${message.author.username}#${message.author.discriminator}`,
                    icon_url: message.author.displayAvatarURL({dynamic:true}),
                },
                description: `A message by ${message.author} has been deleted because it has hit a high severity trigger, disciplinary action should be taken as soon as possible!`,
                fields: [
                    {
                        name: "User Roles",
                        value: `${warnedUser.roles.cache.map(role => role.name).join(", ")}`,
                    },
                    {
                        name: "Triggers Hit",
                        value: `${t}`,
                    },
                    {
                        name: "More Info",
                        value: `${prefix}warnings specific ${warnId}`,
                    },
                    {
                        name: "Full Message",
                        value: fullMessage,
                    }
                ],
                timestamp: new Date(),
            };

            // If not server owner or admin
            if(message.author.id !== message.guild.ownerID) {

                // If admin then ignore
                if (adminRole) {
                    return;
                }

                // If super uses a trigger
                if (superRole) {
                    // Set embed title
                    e.title = `A Member Of The ${superRole.name} Group Has Hit A Trigger!`
                    if (severity === "high") {
                        // Delete the message
                        message.delete().then(() => {
                            // Send the embed with a copy of the message to the super log
                            superLog.send({embeds: [delMsgEmbed]}).then(d => {
                                // Update the db's message link
                                Models.warning.update({message_link: d.url}, {
                                    where: {
                                        warning_id: warnId
                                    }
                                });
                            });
                        });
                    } else if (severity === "medium" || severity === "low") {
                        // Send embed to the super log
                        superLog.send({embeds: [e]});
                    }

                // If mod uses a trigger
                } else if (modRole || modTraineeRole) {
                    // Set embed title based on role
                    if(modRole) {
                        e.title = `A Member Of The ${modRole.name} Group Has Hit A Trigger!`;
                    } else {
                        e.title = `A Member Of The ${modTraineeRole.name} Group Has Hit A Trigger!`
                    }

                    // If there is an super channel
                    if (superChannel) {
                        if (severity === "high") {
                            // Delete the message
                            message.delete().then(() => {

                                // Make sure a super log channel exists
                                if(superLog) {
                                    // Send the embed with a copy of the message to the super log
                                    superLog.send({embeds: [delMsgEmbed]}).then(d => {
                                        // Change the url for the mod channel's embed to link to log in the log channel
                                        e.fields[4].value = d.url;
                                        // Send embed to the super channel
                                        superChannel.send({embeds: [e]});

                                        // Update the db's message link
                                        Models.warning.update({message_link: d.url}, {
                                            where: {
                                                warning_id: warnId
                                            }
                                        });
                                    });

                                // If no super log channel, just send deleted embed to super channel
                                } else {
                                    superChannel.send({embeds: [delMsgEmbed]}).then(d => {
                                        // Update the db's message link
                                        Models.warning.update({message_link: d.url}, {
                                            where: {
                                                warning_id: warnId
                                            }
                                        });
                                    });
                                }
                            });
                        } else if (severity === "medium" || severity === "low") {
                            // Send embed to the super log
                            superLog.send({embeds: e});
                        }

                    // If a super channel isn't found
                    } else if (adminChannel) {
                        if (severity === "high") {
                           // Delete the message
                            message.delete().then(() => {
                                // Send the embed with a copy of the message to the admin channel
                                adminChannel.send({embeds: [delMsgEmbed]});
                            });
                        } else if (severity === "medium" || severity === "low") {
                            // Send embed to the admin channel
                            adminChannel.send({embeds: [e]});
                        }
                    }

                // If any other role uses a trigger
                } else {
                    if (severity === "high") {
                        // Delete the message
                        message.delete().then(() => {
                            // Send the embed with a copy of the message to the mod log
                            logChannel.send({embeds: [delMsgEmbed]}).then(d => {
                                // Change the url for the mod channel's embed to link to log in the log channel
                                e.fields[4].value = d.url;
                                // Send embed to the mod log
                                logChannel.send("@here", {embeds: [e]});

                                // Update the db's message link
                                Models.warning.update({message_link: d.url}, {
                                    where: {
                                        warning_id: warnId
                                    }
                                });
                            });
                        });
                    } else if (severity === "medium") {
                        // Warn the user
                        message.reply(`Please try to refrain from using words such as: \`${t}\``);

                        // Send embed to the moderation log with here tag
                        logChannel.send({embeds: [e]});
                    } else if (severity === "low") {
                        // Warn the user
                        message.reply(`Please try to refrain from using words such as: \`${t}\``);

                        // Send embed to the moderation log
                        logChannel.send({embeds: [e]});
                    }
                }
            }
        }
    }
};