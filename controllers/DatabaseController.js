// Import the required files
const moment = require("moment");
const Discord = require('discord.js');
const TriggersController = require("./TriggersController");
const AutorolesController = require("./AutorolesController");
const JoinableRolesController = require("./JoinableRolesController");
const WarningsController = require("./WarningsController");
const ModerationController = require("./ModerationController");
const AnnouncementController = require("./AnnouncementController");
const Models = require("../models/AllModels");

// Create a new module export
module.exports = {
    // Create a function with required args
    queryHandler: function(i) {

        /*
        ######################################
        ########## trigger commands ##########
        ######################################
        */
        if (i.commandName.includes("trigger")) {

            // Call the trigger handler function from the TriggersController file
            TriggersController.triggerHandler(i);

        /*
        #######################################
        ########## autorole commands ##########
        #######################################
        */
        } else if (i.commandName.includes("autorole")) {
            
            // Call the autoroles handler function from the AutorolesController file
            AutorolesController.autoroleHandler(i);
        
        /*
        #############################################
        ######## (config)joinable(s) command ########
        #############################################
        */
        } else if (i.commandName.includes("joinable")) {

            // Call the joinable roles handler function from the JoinableRolesController file
            JoinableRolesController.joinablesHandler(i);


        /*
        ###################################
        ########## purge command ##########
        ###################################
        */
        } else if (i.commandName === "purge") {
            
            // Call the purge handler function from the ModeratorController file
            ModerationController.purgeHandler(i);


        /*
        ######################################
        ########## warnings command ##########
        ######################################
        */
        } else if (i.commandName === "warnings") {
            // Call the warning handler function from the JoinableRolesController file
            WarningsController.warningHandler(i);

        /*
        ##################################
        ########## kick command ##########
        ##################################
        */
        } else if(i.commandName === "kick") {
            // Call the kick handler function from the ModerationController file
            ModerationController.kickHandler(i);

        /*
        #################################
        ########## ban command ##########
        #################################
        */
        } else if(i.commandName === "ban") {
            // Call the ban handler function from the ModerationController file
            ModerationController.banHandler(i);

        /*
        #################################
        ######## unban command ##########
        #################################
        */
        } else if(i.commandName === "unban") {
            // Call the unban handler function from the ModerationController file
            ModerationController.unbanHandler(i);
            
        /*
        ##################################
        ########## warn command ##########
        ##################################
        */
        } else if(i.commandName === "warn") {
            // Call the warn handler function from the ModerationController file
            ModerationController.warnHandler(i);
            
        /*
        ##################################
        ########## mute command ##########
        ##################################
        */
        } else if(i.commandName === "mute") {
            // Call the mute handler function from the ModerationController file
            ModerationController.muteHandler(i);
            
        /*
        ##################################
        ######### unmute command #########
        ##################################
        */
        } else if(i.commandName === "unmute") {
            // Call the mute handler function from the ModerationController file
            ModerationController.unmuteHandler(i);

        /*
        ####################################
        ######### slowmode command #########
        ####################################
        */
        } else if(i.commandName === "slow") {
            // Call the slowmode handler function from the ModerationController file
            ModerationController.slowmode(i);

        /*
        ###################################
        ########  announce command ########
        ###################################
        */
        } else if(i.commandName === "announce") {
            // Call the mute handler function from the ModerationController file
            AnnouncementController.crudHandler(i);
            
        /*
        ##################################
        ####### createmute command #######
        ##################################
        */
        } else if(i.commandName === "createmute") {
            // Call the mute handler function from the ModerationController file
            ModerationController.createMuteHandler(i);
            
        /*
        #################################
        ####### cmdtoggle command #######
        #################################
        */
        } else if(i.commandName === "cmdtoggle") {
            // Call the cmdToggle handler function from the ModerationController file
            ModerationController.cmdToggleHandler(i);

        /*
        ######################################
        ########## settings command ##########
        ######################################
        */
        } else if(i.commandName === "settings") {
            // Call the settings handler function from the ModerationController file
            ModerationController.settingsHandler(i);

        /*
        ####################################
        ########## testdb command ##########
        ####################################
        */
        } else if (i.commandName === 'testdb') {

            // Authenticate the sequelize object from within a model
            Models.setting.sequelize.authenticate()
            .then(() => {
                // If valid then let user know
                i.reply("Connection Successful!");
            })
            .catch(() => {
                // If inalid then let user know
                i.reply("Connection Failed!");
            });
        };
    },

    // Function for when bot starts up
    botReconnect: function(bu, client) {
        let bannedUrls = bu;

        /*
        ##################################
        ######## create db tables ########
        ##################################
        */
        // Loop through the models object
        for (const key of Object.keys(Models)) {
            /*
            * Sync each model to create the table if needed
            !!!!
            Keep force set to false otherwise it will overwrite the table if one exists!
            !!!!
            */
            Models[key].sync({force: false});
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
            let blacklistedDomains = []; //array for blacklisted urls

            // Loop through each item found and add it to the blacklistedDomains array
            data.forEach((item) => {
                blacklistedDomains.push(item.get('url'));
            });

            // Add the list of blacklisted urls to the local copy
            bannedUrls.list = blacklistedDomains;
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
                const guild = client.guilds.cache.get(item.guild_id);
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
                                value: `${Discord.Formatters.time(banDate, "f")} (${Discord.Formatters.time(banDate, "R")})`,
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


        /*
        #################################
        ###### ANNOUNCEMENTS CHECK ######
        #################################
        */
        // Find all unposted announcements
        Models.announcement.findAll({where: {posted: false},raw:true}).then((data) => {
            if(data) {

                // Loop throught the data
                data.forEach(async (announcement) => {
                    const currentTime = new Date();

                    // Make sure the mute hasn't already been completed
                    if(moment(announcement.post_at).isSameOrBefore(moment(currentTime))) {
                        const channel = client.channels.cache.get(announcement.channel); //get the channel
                        const server = client.guilds.cache.get(announcement.server); //get the server

                        // Create the embed
                        let announceEmbed = new Discord.MessageEmbed()
                            .setColor(`#551CFF`)
                            .setTitle(announcement.title)
                            .setDescription(announcement.body)
                            .setTimestamp(new Date());

                        // If the user wanted to be the author set it to their display name and avatar
                        if(announcement.show_author == true) {
                            let author;

                            // Attempt to find the author
                            try {
                                // If able to find an author by the id, assign to author var
                                author = await server.members.fetch(announcement.author);
                            } catch(e) {
                                // If unable to find author then set to bot
                                author = server.me;
                            }

                            announceEmbed.setAuthor(author.displayName, author.displayAvatarURL({dynamic:true}));

                        // If the user didn't want to be the author set to the bot's display name and avatar
                        } else {
                            announceEmbed.setAuthor(server.me.displayName, server.me.displayAvatarURL({dynamic:true}));
                        }

                        channel.send({embeds: [announceEmbed]}).then((msg) => {

                            // If reactions were given
                            if(announcement.reactions !== null) {
                                // Attempt to react to announceMsg
                                try {
                                    // Convert the reactions string to an array
                                    const reactionArr = announcement.reactions.split(",");

                                    // Loop through the array and react with the reactions in order given
                                    reactionArr.forEach(async (reaction) => {
                                        await msg.react(reaction)
                                    })
                                // Catch and log any errors
                                } catch(e) {
                                    console.error("One of the emojis from the announcement builder failed to react!", e)
                                }
                            }

                            // Update the posted field for the announcement
                            Models.announcement.update({posted: 1}, {where: {id: announcement.id}});
                        })
                    }
                })


            }
        })
    }
}