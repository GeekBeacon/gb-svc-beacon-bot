// Import the required files
const Models = require("../models/AllModels");
const shortid = require('shortid');
const Discord = require(`discord.js`)
const Lodash = require(`lodash`)

// Create a new module export
module.exports = {
    // Create a function with required args
    triggerHandler: function(interaction) {
        // Create vars
        let trigger = interaction.options.getString(`trigger`);
        const triggerAction = interaction.options.getSubcommand();
        const superRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("admin_role_id"));
        const ownerId = interaction.member.guild.ownerId;

        /*********** LIST TRIGGERS ***********/
        if (triggerAction === 'list') {

            let enabledTriggers = [];
            let disabledTriggers = [];

            // If a trigger was passed in
            if(interaction.options.get(`trigger`)) {
                // Attempt to find the trigger in the db
                Models.trigger.findOne({where: {trigger:trigger}}).then(async (trig) =>{
                    // If a matching trigger was found
                    if(trig) {
                        // Get the user that added the trigger
                        const creator = await interaction.client.users.fetch(trig.get(`user_id`));
                        let embedColor = ""; //color for the embed

                        // Set the embed color based on severify level
                        switch(trig.get(`severity`)) {
                            case "high":
                                embedColor = "#FF0000";
                                break;
                            case "medium":
                                embedColor = "#FFA500";
                                break;
                            case "low":
                                embedColor = "#00FF00";
                                break;
                        }

                        // Create embed
                        const triggerEmbed = new Discord.EmbedBuilder()
                            .setColor(embedColor)
                            .setTitle(`Information for ${trig.get(`trigger`)}`)
                            .addFields(
                                {name: `Word/Phrase`, value: `${trig.get("trigger")}`, inline: false},
                                {name: `Severity`, value: `${Lodash.startCase(trig.get("severity"))}`, inline: true},
                                {name: `Enabled`, value: `${trig.get("enabled") == 1 ? "True" : "False"}`, inline: true},
                                {name: `Created by`, value: `${creator}`, inline: true}
                            )
                            .setTimestamp();

                        // Send the user the embed
                        interaction.reply({embeds: [triggerEmbed], ephemeral: true});

                    // If no matching trigger was found let the user know
                    } else {
                        interaction.reply({content:`Uh oh! Looks like ${interaction.option.getString(`trigger`)} isn't in the list of triggers!`, ephemeral:true});
                    }
                })

            // If no trigger was passed in
            } else {
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

            if(!(superRole || adminRole || ownerId === interaction.member.id)) return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

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
            if(!(adminRole || ownerId === interaction.member.id)) return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

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
            if(!(superRole || adminRole || ownerId === interaction.member.id)) return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

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
                            const triggerValues = {"severity":trig.severity, "enabled":true}
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
            if(!(superRole || adminRole || ownerId === interaction.member.id)) return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});
            
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
                            const triggerValues = {"severity":trig.severity, "enabled":false}
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
    triggerHit: async function(m, t, c) {
        // Create vars
        const message = m, triggers = t, client = c;
        let severity, warnId;
        let severityArr = [];
        const modRole = message.member.roles.cache.find(role => role.id === client.settings.get("mod_role_id"));
        const modTraineeRole = message.member.roles.cache.find(role => role.id === client.settings.get("trainee_role_id"));
        const superRole = message.member.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.member.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));
        let embedArr = [];

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

                // Store the data
                Models.warning.create({
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
                .then((item) => {
                    // Set the id for the warning
                    warnId = item.id;

                    // If the message is able to fit within the field value character limit
                    if(message.content.length <= 1024) {
                        // Create the embed
                        const trigEmbed = new Discord.EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle(`A Member Has Hit A Trigger!`)
                        .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                        .setDescription(`${message.author} has been warned for saying a trigger!`)
                        .addFields(
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
                                value: `/warnings specific ${warnId}`,
                            },
                            {
                                name: `Full Message`,
                                value: message.content
                            },
                            {
                                name: "Message URL",
                                value: message.url,
                            }
                        )
                        .setTimestamp();

                        // Add the embed to the embedArr
                        embedArr.push(trigEmbed);
                        
                    // If the message is too big for the embed field value
                    } else {
                        // Create the information embed
                        const infoEmbed = new Discord.EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle(`A Member Has Hit A Trigger!`)
                        .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                        .setDescription(`${message.author} has been warned for saying a trigger!`)
                        .addFields(
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
                                value: `/warnings specific ${warnId}`,
                            },
                            {
                                name: "Message URL",
                                value: message.url,
                            }
                        )
                        .setTimestamp();

                        // Add the embed to the embedArr
                        embedArr.push(infoEmbed);

                        // Create the message embed
                        const msgEmbed = new Discord.EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle(`Full Message`)
                        .setDescription(`${message.content}`)

                        // Add the embed to the embedArr
                        embedArr.push(msgEmbed);
                    }

                    switch(severity) {
                        case "high":
                            handleHigh(triggers, embedArr);
                            break;
                        case "medium":
                            handleMedium(triggers, embedArr);
                            break;
                        case "low":
                            handlelow(triggers, embedArr);
                            break;
                    }
                });
            });
        });

        // Handle the high severity trigger(s)
        async function handleHigh(t, e) {

            // Loop through the embed array
            e.forEach((embed) => {
                // Set the color for the embed
                embed.setColor(0xFF0000); // red since high severity
            })

            // Set description for high severity urgency
            e[0].setDescription(`A message by ${message.author} has been deleted for saying a trigger, further action is required!`)

            // Call reportLadder function
            reportLadder(t, e);
        }

        // Handle the medium severity trigger(s)
        async function handleMedium(t, e) {

            // Loop through the embed array
            e.forEach((embed) => {
                // Set the color for the embed
                embed.setColor(0xFFA500); // orange since medium severity

            })

            // Set description for medium severity urgency
            e[0].setDescription(`${message.author} has been warned for containing a trigger, further action may be required!`)
            
            // Call reportLadder function
            reportLadder(t, e);
        }

        // Handle the low severity trigger(s)
        async function handlelow(t, e) {
            // Call reportLadder function
            reportLadder(t, e);
        }

        // Sends reports of triggers based on user's permissions and the existence of specific channels
        async function reportLadder(t, e) {
            const superChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_channel_name")))); //super channel
            const adminChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("admin_channel_name")))); //admin channel
            const superLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_log_channel_name")))); //super log channel
            const logChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //action log channel
            // Gets the guildMember instance of the user so we can get more information on them and their information within our server.
            warnedUser = client.guilds.cache.get(message.guild.id).members.cache.get(message.author.id);
            const delEmbedArr = [];

            // If the message can fit within the field value character limit
            if(message.content.length <= 1024) {
                // Create the delete embed
                const delEmbed = new Discord.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`Trigger Message Deleted!`)
                .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                .setDescription(`A message by ${message.author} has been deleted because it has hit a high severity trigger, disciplinary action should be taken as soon as possible!`)
                .addFields(
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
                        value: `/warnings specific ${warnId}`,
                    },
                    {
                        name: "Full Message",
                        value: message.content,
                    }
                )
                .setTimestamp();

                // Add the embed to the delEmbedArr
                delEmbedArr.push(delEmbed);

            // If the message is too long to fit in the field value
            } else {
                // Create the infomation embed
                const infoEmbed = new Discord.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`Trigger Message Deleted!`)
                .setAuthor({name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL({dynamic:true})})
                .setDescription(`A message by ${message.author} has been deleted because it has hit a high severity trigger, disciplinary action should be taken as soon as possible!`)
                .addFields(
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
                        value: `/warnings specific ${warnId}`,
                    },
                )
                .setTimestamp();

                // Add the embed to the delEmbedArr
                delEmbedArr.push(infoEmbed);

                // Create the delete embed
                const delMsgEmbed = new Discord.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`Trigger Message Deleted!`)
                .setDescription(`${message.content}`)

                // Add the embed to the delEmbedArr
                delEmbedArr.push(delMsgEmbed);
            }

            // If not server owner or admin
            if(message.author.id !== message.guild.ownerID) {

                // If admin then ignore
                if (adminRole) {
                    return;
                }

                // If super uses a trigger
                if (superRole) {
                    // Set embed title
                    delEmbedArr[0].title = `A Member Of The ${superRole.name} Group Has Hit A Trigger!`
                    if (severity === "high") {
                        // Delete the message
                        message.delete().then(async () => {
                            // Send the embed with a copy of the message to the super log
                            await superLog.send({embeds: delEmbedArr}).then(d => {
                                // Update the db's message link
                                Models.warning.update({message_link: d.url}, {
                                    where: {
                                        id: warnId
                                    }
                                });
                            });
                        });
                    } else if (severity === "medium" || severity === "low") {
                        // Send embed to the super log
                        await superLog.send({embeds: e});
                    }

                // If mod uses a trigger
                } else if (modRole || modTraineeRole) {
                    // Set embed title based on role
                    if(modRole) {
                        e[0].title = `A Member Of The ${modRole.name} Group Has Hit A Trigger!`;
                    } else {
                        e[0].title = `A Member Of The ${modTraineeRole.name} Group Has Hit A Trigger!`
                    }

                    // If there is an super channel
                    if (superChannel) {
                        if (severity === "high") {
                            // Delete the message
                            await message.delete().then(async () => {

                                // Make sure a super log channel exists
                                if(superLog) {
                                    // Send the embed with a copy of the message to the super log
                                    await superLog.send({embeds: delEmbedArr}).then(async (d) => {
                                        
                                        // Change the url in the embed
                                        e[0].data.fields[3] = d.url;

                                        // Send embed to the super channel
                                        await superChannel.send({embeds: e});

                                        // Update the db's message link
                                        Models.warning.update({message_link: d.url}, {
                                            where: {
                                                id: warnId
                                            }
                                        });
                                    });

                                // If no super log channel, just send deleted embed to super channel
                                } else {
                                    await superChannel.send({embeds: delEmbedArr}).then(d => {
                                        // Update the db's message link
                                        Models.warning.update({message_link: d.url}, {
                                            where: {
                                                id: warnId
                                            }
                                        });
                                    });
                                }
                            });
                        } else if (severity === "medium" || severity === "low") {
                            // Send embed to the super log
                            await superLog.send({embeds: e});
                        }

                    // If a super channel isn't found
                    } else if (adminChannel) {
                        if (severity === "high") {
                           // Delete the message
                            await message.delete().then(async () => {
                                // Send the embed with a copy of the message to the admin channel
                                await adminChannel.send({embeds: delEmbedArr});
                            });
                        } else if (severity === "medium" || severity === "low") {
                            // Send embed to the admin channel
                            await adminChannel.send({embeds: e});
                        }
                    }

                // If any other role uses a trigger
                } else {
                    if (severity === "high") {
                        // Delete the message
                        await message.delete().then(async () => {
                            // Send the embed with a copy of the message to the mod log
                            await logChannel.send({embeds: delEmbedArr}).then(async (d) => {

                                // Splice the 4th field to remove it and replace it with the new URL
                                e[0].spliceFields(3,1,{name: `Message URL`, value: d.url, inline: false});

                                // Send embed to the mod log
                                await logChannel.send({content: "@here", embeds: e});

                                // Update the db's message link
                                Models.warning.update({message_link: d.url}, {
                                    where: {
                                        id: warnId
                                    }
                                });
                            });
                        });
                    } else if (severity === "medium") {
                        // Warn the user
                        message.reply(`Please try to refrain from using words such as: \`${t}\``);

                        // Send embed to the moderation log with here tag
                        await logChannel.send({embeds: e});
                    } else if (severity === "low") {
                        // Warn the user
                        message.reply(`Please try to refrain from using words such as: \`${t}\``);

                        // Send embed to the moderation log
                        await logChannel.send({embeds: e});
                    }
                }
            }
        }
    }
};