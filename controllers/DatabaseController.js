// Import the required files
const Discord = require('discord.js');
const Models = require("../models/AllModels");
const moment = require("moment");

// Create a new module export
module.exports = {
    // Create a function with required args
    queryHandler: function(interaction) {

        // If the member used the testdb command
        if (interaction.commandName === 'testdb') {

            // Authenticate the sequelize object from within a model
            Models.setting.sequelize.authenticate()
            .then(() => {
                // If valid then let user know
                interaction.reply("Connection Successful!");
            })
            .catch(() => {
                // If inalid then let user know
                interaction.reply("Connection Failed!");
            });
        };
    },

    settingsHandler: async function(interaction) {
        const setting = interaction.options.getString(`setting`); //get the setting
        const subcommand = interaction.options.getSubcommand(); //get the subcommand
        const superLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("super_log_channel_name")))); //super log channel

        if(subcommand === `list`) {

            let settingsArr = [];

            // Look for the settings in the db
            Models.setting.findAll().then(async (settings) => {

                // If settings were found
                if(settings) {

                    // Loop through the settings
                    settings.forEach((item) => {

                        // Add the name of the setting to the settingsArr
                        settingsArr.push(`\`\`${item.get("name")}\`\``);
                    })

                    // Create the embed
                    const settingsEmbed = new Discord.EmbedBuilder()
                        .setColor(`#886CE4`)
                        .setTitle(`Below Are The Names Of All Settings`)
                        .setAuthor({name: `${interaction.member.displayName}`, iconURL: `${interaction.member.displayAvatarURL({dynamic: true})}`})
                        .setDescription(`${settingsArr.join(` , `)}`)
                        .setTimestamp()

                    // If the member is in the super log channel
                    if(superLog.id === interaction.channel.id) {

                        // Reply with the embed and message
                        interaction.reply({embeds: [settingsEmbed]});

                    // If the member isn't in the super log channel
                    } else {

                        // Send the embed to the super log channel and let the member know to check
                        superLog.send({embeds: [settingsEmbed]});
                        interaction.reply({content: `I have sent the requested data to the ${superLog} channel!`, ephemeral: true});
                    }
                }
            })

        } else if (subcommand === "view") {

            // Look for the setting in the db
            Models.setting.findOne({where: {name: setting}}).then((item) => {
                // If no setting was found, let the user know
                if(!item) return interaction.reply({content: `Uh oh! Looks like ${setting} isn't a valid setting, please try again!`, ephemeral: true});

                const settingVal = item.get(`value`);
                
                let settingEmbed = new Discord.EmbedBuilder()
                    .setColor(`#886CE4`)
                    .setTitle(`Setting Information`)
                    .setAuthor({name: `${interaction.member.displayName}`, iconURL: `${interaction.member.displayAvatarURL({dynamic: true})}`})
                    .setDescription(`Here is the data for the ${setting} setting!`)
                    .addFields(
                        {name: `Id`, value: `\`\`${item.get(`id`)}\`\``, inline: true},
                        {name: `\u200B`, value: `\u200B`, inline: true},
                        {name: `Name`, value: `\`\`${item.get(`name`)}\`\``, inline: true},
                        {name: `Created`, value: `${Discord.time(item.get(`createdAt`), Discord.TimestampStyles.RelativeTime)}`, inline: true},
                        {name: `\u200B`, value: `\u200B`, inline: true},
                        {name: `Updated`, value: `${Discord.time(item.get(`updatedAt`), Discord.TimestampStyles.RelativeTime)}`, inline: true},
                    )
                    .setTimestamp();

                // If the value is too long for an embed's value but not a message
                if(settingVal.length > 1017 && settingVal.length <= 1993) {
                    // Send the embed with an additional message

                    // If the member is in the super log channel
                    if(superLog.id === interaction.channel.id) {

                        // Reply with the embed and message
                        interaction.reply({embeds: [settingEmbed], content: `Value: \`\`${settingVal}\`\``});

                    // If the member isn't in the super log channel
                    } else {

                        // Send the embed to the super log channel and let the member know to check
                        superLog.send({embeds: [settingEmbed], content: `Value: \`\`${settingVal}\`\``});
                        interaction.reply({content: `I have sent the requested data to the ${superLog} channel!`, ephemeral: true});
                    }

                // If the value is under the embed's value limit
                } else if (settingVal.length <= 1024) {
                    // Add the value to the embed and send
                    settingEmbed.addFields({name: `Value`, value: `\`\`${settingVal}\`\``, inline: false});

                    // If the member is in the super log channel
                    if(superLog.id === interaction.channel.id) {

                        // Reply with the embed and message
                        interaction.reply({embeds: [settingEmbed]});

                    // If the member isn't in the super log channel
                    } else {

                        // Send the embed to the super log channel and let the member know to check
                        superLog.send({embeds: [settingEmbed]});
                        interaction.reply({content: `I have sent the requested data to the ${superLog} channel!`, ephemeral: true});
                    }


                // If the value exceeds all limits
                } else {
                    // Send the embed, along with a message letting the member know that the value can't be displayed

                    // If the member is in the super log channel
                    if(superLog.id === interaction.channel.id) {

                        // Reply with the embed and message
                        interaction.reply({embeds: [settingEmbed], content: `The value for this setting is too long to be sent on Discord, so unfortunately you will have to look it up manually!`});

                    // If the member isn't in the super log channel
                    } else {

                        // Send the embed to the super log channel and let the member know to check
                        superLog.send({embeds: [settingEmbed], content: `The value for this setting is too long to be sent on Discord. Unfortunately you will have to look it up manually!`});
                        interaction.reply({content: `I have sent the requested data to the ${superLog} channel!`, ephemeral: true});
                    }
                }

            // Catch any errors
            }).catch((e) => {
                console.error(e);
            });

        } else if (subcommand === "update") {

            // If the member isn't an Admin, deny the use of this subcommand and let them know
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({content: `Uh oh! This subcommand is only for Administrators. If you think something needs to be updated, please contact an Administrator!`, ephemeral: true});

            Models.setting.findOne({where: {name: setting}}).then(async (item) => {
                // If no setting was found, let the user know
                if(!item) return interaction.reply({content: `Uh oh! Looks like ${setting} isn't a valid setting, please try again!`, ephemeral: true});

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
                interaction.reply({content: `**WARNING!**\n\nThis subcommand is dangerous and could result in me crashing if not used properly. Are you sure you wish to continue?`, ephemeral: true, components: [btns], fetchReply: true})
                    .then(async (msg) => {

                        // Create the collector to capture the button clicks
                        const btnCollector = await msg.createMessageComponentCollector({componentType: Discord.ComponentType.Button, max:1,  time:15000});

                        // When a button is clicked
                        btnCollector.on(`collect`, async i => {
                            // If the user agreed to continue
                            if(i.customId === "yes") {

                                // Build the modal
                                const settingModal = new Discord.ModalBuilder()
                                    .setCustomId(`settingsModal`)
                                    .setTitle(`Updating ${item.get(`name`)}`);

                                // Build the setting value input field
                                const settingValInput = new Discord.TextInputBuilder()
                                    .setCustomId(`settingVal`)
                                    .setLabel(`Delete the old value and add the new one`)
                                    .setValue(`${item.get("value")}`)
                                    .setMinLength(1)
                                    .setMaxLength(4000)
                                    .setStyle(Discord.TextInputStyle.Short)
                                    .setRequired(true);

                                // Create the action row to hold the settingValInput
                                const actionRow = new Discord.ActionRowBuilder().addComponents(settingValInput);

                                // Add the input to the modal
                                settingModal.addComponents(actionRow);

                                // Show the modal to the member
                                await i.showModal(settingModal);

                            // If the user wanted to abort
                            } else {
                                return i.reply({content: `Got it! I have aborted this function. Please contact my manager if you feel a setting should be changed!`, ephemeral: true});
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
            })
        }
    },

    // Function to take data from modal to update a setting
    updateSetting: function(interaction) {
        // Find the setting
        Models.setting.findOne({where: {name: interaction.customId}}).then((item) => {
            // If the setting was found
            if(item) {

                // Update the setting's value
                Models.setting.update({value: interaction.fields.getTextInputValue(`settingVal`)}, {where: {id: item.get(`id`)}}).then(() => {

                    // Let the member know that the setting has been updated
                    interaction.reply({content: `${interaction.member}, I have successfully changed the value for ${interaction.customId}!`});
                });

            // If the setting wasn't found let the member know
            } else {
                interaction.reply({content: `Uh oh! It seems there was an issue updating that setting. Please contact my manager so they can fix me up!`})
            }
        })
    },

    // Function for when bot starts up
    botReconnect: function(client) {

        /*
        ##################################
        ######## create db tables ########
        ##################################
        */
        // Loop through the models object
        for (const key of Object.keys(Models)) {
            /*
            * Sync each model to create the table if needed, using alter to ensure the tables match the models
            !!!!
            Keep force set to false otherwise it will overwrite the table if one exists!
            !!!!
            */
            Models[key].sync({force: false, alter: true});
        };

        /*
        #####################################
        ######## gather cmd settings ########
        #####################################
        */
        // Find all the commands in the database
        Models.command.findAll().then((cmds) =>{
            // Loop through each command
            cmds.forEach((cmd) =>{
                // Find the command in the local collection
                let localCmd = client.commands.get(cmd.get(`name`));

                // Assign the values from the database to the local command's values
                localCmd.enabled = cmd.get("enabled");
                localCmd.mod = cmd.get("mod");
                localCmd.super = cmd.get("super");
                localCmd.admin = cmd.get("admin");
            });
        })
        
        /*
        ###################################
        ######## populate triggers ########
        ###################################
        */
        // Get all rows of enabled triggers and add them to the triggerList
        Models.trigger.findAll({
            where: {
                enabled: 1 //make sure trigger is enabled; 0 = false 1 = true
            }
        }).then((data) => {
            // Loop through each item found and add it to the triggers obj
            data.forEach((item) => {
                // Assign the trigger's local collection values
                const triggerValues = {"severity":item.get(`severity`), "enabled":item.get(`enabled`)}
                // Update the local collection trigger's values
                client.triggers.set(item.get(`trigger`),triggerValues);
            });
        }).catch((e) => {
             console.error("Error: "+e);
        });

        /*
        ####################################
        ######## populate blacklist ########
        ####################################
        */
        // Get all rows of blacklisted urls and add them to the blacklistedDomains list
        Models.bannedurl.findAll().then((data) => {

            // Loop through each item found and add it to the blacklistedDomains array
            data.forEach((item) => {
                client.blacklist.set(item.get(`id`), item.get(`url`));
            });
        }).catch((e) => {
             console.error("Error: "+e);
        });
    },

    // Function to check db on startup
    databaseCheck: async function(c) {
        const client = c;
        let bannedUsers = []; // array for all banned users
        let logChannel; // var for action log channel(s)

        // Find all uncompleted bans
        Models.ban.findAll({where: {completed: false},raw:true}).then((data) => {
            const now = moment().utc();
            // If the ban(s) were found...
            if (data) {
                // Loop through each row from the db
                data.forEach((ban) => {
                    let ubDate = ban.unban_date; // store the unban date
                    // Make sure the ban hasn't already been completed
                    if(moment(ubDate).isSameOrBefore(now)) {
                        let banObj = {}; // ban object

                        // Add the data to the ban object
                        banObj.id = ban.id
                        banObj.userId = ban.user_id;
                        banObj.guildId = ban.guild_id;
                        banObj.reason = ban.reason;
                        banObj.unbanDate = ban.unban_date;
                        banObj.modId = ban.moderator_id;
                        banObj.completed = ban.completed;
                        banObj.created = ban.createdAt;
                        banObj.updated = ban.updatedAt;
                        
                        // Add the ban to the banned users array
                        bannedUsers.push(banObj);
                    }
                })
            // If no bans were found just ignore
            } else {
                return;
            }
        }).then(() => {
            // Loop through each user that needs to be unbanned
            bannedUsers.forEach((item) => {
                // Find the server the user was banned from
                const guild = client.guilds.cache.get(item.guildId);
                logChannel = guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //action log channel

                // Unban the user with a time up reason
                guild.members.unban(item.userId, "Ban Expiration").then(() => {
                    const user = client.users.cache.get(item.userId); //get the user that was banned
                    const moderator = client.users.cache.get(item.modId); //get the moderator that performed the ban
                    let banDate = item.created;

                    // Update the completed field
                    Models.ban.update({completed: true}, {where: {id: item.id}});

                    // Create the unban embed
                    const unbanEmbed = {
                        color: 0xFF5500,
                        title: "User Unbanned",
                        author: {
                            name: `${user.username}#${user.discriminator}`,
                            icon_url: user.displayAvatarURL({dynamic:true}),
                        },
                        description: `${user.username}'s ban has expired`,
                        fields: [
                            {
                                name: `User`,
                                value: `${user}`,
                                inline: true,
                            },
                            {
                                name: `Date Banned`,
                                value: `${Discord.time(banDate, "R")}`,
                                inline: true,
                            },
                            {
                                name: `Banned By`,
                                value: `${moderator}`,
                                inline: true,
                            },
                            {
                                name: `Reason`,
                                value: `${item.reason}`,
                                inline: false,
                            },
                        ],
                        timestamp: new Date(),
                        footer: {
                            text: `Ban Id: ${item.id}`
                        }
                    };

                    // Send the embed to the log channel
                    logChannel.send({embeds: [unbanEmbed]});
                });
            });
        });
    }
}