// Import required files
const Models = require("../models/AllModels");
const Discord = require(`discord.js`);
const {server_id} = require(`../config`);

// Create a new module export
module.exports = {

    // Method for handling guild member changes
    memberHandler: async function(oldMember, newMember) {

        // this.userHandler(oldMember.user, newMember.user);

        const actionLog = newMember.guild.channels.cache.find((c => c.name.includes(newMember.client.settings.get("mod_log_channel_name")))); //mod log channel
        let embedDesc;

        if(oldMember.nickname !== newMember.nickname) {

            // Query the audit logs to find the latest member update log
            const auditLogs = await newMember.guild.fetchAuditLogs({
                type: Discord.AuditLogEvent.MemberUpdate,
                limit: 1,
            });

            // Get the first entry from the matching audit logs above
            const newestLog = auditLogs.entries.first();

            // Find the executor of the nickname change
            const executor = await newMember.guild.members.fetch(newestLog.executorId);

            // Determine the embed description
            if(!newMember.nickname) {
                embedDesc = `reset`
            } else {
                embedDesc = `changed to \`${newMember.nickname}\``;
            }

            // Create the embed
            const nickChangeEmbed = new Discord.EmbedBuilder()
                .setColor(0x886ce4) //purple
                .setTitle(`Member Nickname Changed`)
                .setAuthor({name: `${executor.displayName}`, iconURL: `${executor.displayAvatarURL({dynamic:true})}`})
                .setDescription(`${newMember}'s nickname was ${embedDesc}`)
                .addFields(
                    {name: `Member Edited`, value: `${newMember}`, inline: true},
                    {name: '\u200B', value: '\u200B', inline: true}, //empty field for formatting
                    {name: `Edited By`, value: `${executor}`, inline: true},
                    {name: `Old Nickname`, value: `${oldMember.nickname || "None"}`, inline: true},
                    {name: '\u200B', value: '\u200B', inline: true}, //empty field for formatting
                    {name: `New Nickname`, value: `${newMember.nickname || "None"}`, inline: true},
                )
            .setTimestamp();

            /* 
            * Sync the model to the table
            * Creates a new table if table doesn't exist, otherwise just inserts a new row
            * id, createdAt, and updatedAt are set by default; DO NOT ADD
            !!!!
                Keep force set to false otherwise it will overwrite the table instead of making a new row!
            !!!!
            */
            Models.nameChange.sync({force: false}).then(() => {
                // Look for the member's entry in the table
                Models.nameChange.findOne({where: {user_id: newMember.id}, raw: true}).then((member) => {
                    // If the member has an entry in the table, update it
                    if(member) {
                        let newNicknames; //nicknames var

                        // If the member added a new nickname
                        if(newMember.nickname) {

                            // If there are no nicknames in the db for this user, only add the new nickname
                            if(!member.nicknames) {
                                newNicknames = newMember.nickname;

                            // If there are nicknames in the db for this user, add the old and new nickname together with a comma
                            } else {
                                newNicknames = `${member.nicknames},${newMember.nickname}`;
                            }
                        
                            // Update the nicknames field in the db entry
                            Models.nameChange.update({nicknames: newNicknames}, {where: {user_id: newMember.id}}).then(() =>{

                                // Send the embed to the mod log channel
                                actionLog.send({embeds: [nickChangeEmbed]});
                            });
                        }

                    // If the member has no entry in the table, create one
                    } else {
                        let nicknamesStr;

                        // Determine the nicknames string
                        if(!newMember.nickname) {
                            nicknamesStr = `${oldMember.nickname}`;
                        } else if(!oldMember.nickname) {
                            nicknamesStr = `${newMember.nickname}`;
                        } else {
                            nicknamesStr = `${oldMember.nickname},${newMember.nickname}`;
                        }

                        // Create a new db entry
                        Models.nameChange.create({
                            user_id: newMember.id,
                            usernames: newMember.user.tag,
                            nicknames: nicknamesStr
                        }).then(() => {
                            // Send the embed to the mod log channel
                            actionLog.send({embeds: [nickChangeEmbed]});
                        })
                    }
                })
            });
        }
    },

    // Method for handling Discord user changes
    userHandler: async function(oldUser, newUser) {
        const guild = await newUser.client.guilds.cache.get(server_id); //the guild
        const actionLog = guild.channels.cache.find((c => c.name.includes(newUser.client.settings.get("mod_log_channel_name")))); //mod log channel

        // If the user changed their username
        if(oldUser.tag !== newUser.tag) {

            // Create the embed
            const usernameChangedEmbed = new Discord.EmbedBuilder()
                .setColor(0x886ce4) //purple
                .setTitle(`Member Username Changed`)
                .setAuthor({name: `${newUser.tag}`, iconURL: `${newUser.displayAvatarURL({dynamic:true})}`})
                .setDescription(`${newUser}'s username was changed`)
                .addFields(
                    {name: `Member Edited`, value: `${newUser}`, inline: true},
                    {name: `Old Username`, value: `${oldUser.tag}`, inline: true},
                    {name: `New Username`, value: `${newUser.tag}`, inline: true},
                )
            .setTimestamp();

            /* 
            * Sync the model to the table
            * Creates a new table if table doesn't exist, otherwise just inserts a new row
            * id, createdAt, and updatedAt are set by default; DO NOT ADD
            !!!!
                Keep force set to false otherwise it will overwrite the table instead of making a new row!
            !!!!
            */
            Models.nameChange.sync({force: false}).then(() => {

                // Look for the member's entry in the table
                Models.nameChange.findOne({where: {user_id: newUser.id}, raw: true}).then((user) => {
                    // If the member has an entry in the table, update it
                    if(user) {

                        // Update the usernames field in the db entry
                        Models.nameChange.update({usernames: `${user.usernames},${newUser.tag}`}, {where: {user_id: newUser.id}}).then(() => {

                            // Send the embed to the mod log channel
                            actionLog.send({embeds: [usernameChangedEmbed]});
                        });

                    // If the member has no entry in the table, create one
                    } else {

                        // Create a new db entry
                        Models.nameChange.create({
                            user_id: newUser.id,
                            usernames: `${oldUser.tag},${newUser.tag}`
                        }).then(() => {
                            // Send the embed to the mod log channel
                            actionLog.send({embeds: [usernameChangedEmbed]});
                        })
                    }
                })
            });

        }
    },

    // Method for listing name changes
    listChanges: async function(interaction) {
        const subcommand = interaction.options.getSubcommand(); //get the subcommand
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel

        // If the recent name change logs were requested
        if(subcommand === `recent`) {
            const recentCount = interaction.options.getInteger(`amount`); //user's requested count

            // Get the requested amount of newest name changes
            Models.nameChange.findAll({limit:recentCount, order: [['createdAt', 'DESC']], raw:true}).then((data) => {
                // If data is found
                if(data) {

                    // If the table is empty then let the user know
                    if(data.length === 0) {
                        return interaction.reply({content: "There are currently no name changes in the database!", ephemeral: true});
                    }

                    let i = 1; // counter
                    // Create the embed
                    let recentEmbed = new Discord.EmbedBuilder()
                    .setColor('#33CCFF')
                    .setTitle('Most Recent Name Changes')
                    .setDescription(`These are the ${data.length} most recent name changes.`)
                    .setTimestamp();

                    // Add a new field for each name change
                    data.forEach(nc => {
                        const user = interaction.client.users.cache.get(nc.user_id.toString()); //get the user
                        const nicknames = nc.nicknames; //nicknames
                        const usernames = nc.usernames.split(`,`); //usernames
                        let newestUsername = usernames[usernames.length -1]; // Newest username
                        let newestNickname; //newest nickname var

                        // If there are nicknames for the user
                        if(nicknames) {
                            let nicknameArr = nicknames.split(`,`); //split nicknames string into array

                            // Get the newest one
                            newestNickname = nicknameArr[nicknameArr.length -1]; // Newest nickname

                        // If no nicknames, set to none
                        } else {
                            // If no nickname, set newestNickname to "None"
                            if(!newestNickname) {
                                newestNickname = "None";
                            }
                        }

                        // Add a field to the embed
                        recentEmbed.addFields({
                            name: `Log #${i}`,
                            value: `**User:** ${user} | **Username:** \`${newestUsername}\` | **Nickname:** \`${newestNickname}\``
                        });
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
                }
            })
        } else if (subcommand === `user`) {
            const user = interaction.options.getUser(`user`);

            // Query the db for the user's name changes
            Models.nameChange.findOne({where: {user_id: user.id}, raw:true}).then((data) => {
                // If the user has name changes in the db
                if(data) {
                    let usernameString = data.usernames; //usernames in the db
                    let nicknameString = data.nicknames; //nicknames in the db
                    let usernameArr, username10, usernames, nicknameArr, nickname10, nicknames; //vars for name changes


                    // Handle the usernames string
                    if(usernameString) {
                        usernameArr = usernameString.split(`,`); //split into array
                        username10 = usernameArr.slice(-10); //get the last 10 from the array

                        // Add backticks to each item for formatting
                        username10 = username10.map(function(item) {
                            return '\`' + item + '\`';
                        });

                        const uniqU = [ ...new Set(username10) ]; //remove duplicates
                        usernames = uniqU.reverse().join(`, `); //reverse the array
                    }

                    // Handle the nickname string
                    if (nicknameString) {
                        nicknameArr = nicknameString.split(`,`); //split into array
                        nickname10 = nicknameArr.slice(-10); //get the last 10 from the array

                        // Add backticks to each item for formatting
                        nickname10 = nickname10.map(function(item) {
                            return '\`' + item + '\`';
                        });

                        const uniqN = [ ...new Set(nickname10) ]; //remove duplicates
                        nicknames = uniqN.reverse().join(`, `); //reverse the array
                    } else {
                        nicknames = `None`;
                    }


                    // Build the embed
                    const userDataEmbed = new Discord.EmbedBuilder()
                    .setColor(`#33ccff`)
                    .setAuthor({name: `${user.tag}`, iconURL: `${user.displayAvatarURL({dynamic:true})}`})
                    .setTitle(`Name Changes For ${user.tag}`)
                    .setDescription(`This is a log of the 10 most recent, unique, name changes for ${user}.\nIf you are looking for older name changes, please contact an administrator!`)
                    .addFields(
                        {name: `Usernames`, value: `${usernames}`, inline: false},
                        {name: `Nicknames`, value: `${nicknames}`, inline: false}
                    )
                    .setTimestamp()
                    .setFooter({text: `User Id: ${user.id}`})

                    // If the user is in the action log
                    if(interaction.channel.id === actionLog.id) {
                        // Reply with the embed
                        interaction.reply({embeds: [userDataEmbed]});

                    // If the user isn't in the action log
                    } else {
                        // Send the warnings to the action log channel
                        actionLog.send({embeds: [userDataEmbed]}).then(() => {

                            // Reply in channel letting them know they've been messaged
                            interaction.reply({content: `I've sent a message containing the data you requested to ${actionLog}.`, ephemeral: true});
                        });
                    }

                // If no logs for the user, let the moderator know
                } else {
                    return interaction.reply({content: `Uh oh! It looks like this user (${user}) has no logged name changes!`, ephemeral: true});
                }
            })
        }
    }
}