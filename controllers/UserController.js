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

                        // If the member added a new nickname
                        if(newMember.nickname) {
                            // Update the nicknames field in the db entry
                            Models.nameChange.update({nicknames: `${member.nicknames},${newMember.nickname}`}, {where: {user_id: newMember.id}}).then(() =>{

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
                            usernames: newMember.user.username,
                            discriminators: newMember.user.discriminator,
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
        if(oldUser.username !== newUser.username) {

            // Create the embed
            const usernameChangedEmbed = new Discord.EmbedBuilder()
                .setColor(0x886ce4) //purple
                .setTitle(`Member Username Changed`)
                .setAuthor({name: `${newUser.tag}`, iconURL: `${newUser.displayAvatarURL({dynamic:true})}`})
                .setDescription(`${newUser}'s username was changed`)
                .addFields(
                    {name: `Member Edited`, value: `${newUser}`, inline: true},
                    {name: `Old Username`, value: `${oldUser.username}`, inline: true},
                    {name: `New Username`, value: `${newUser.username}`, inline: true},
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
                        Models.nameChange.update({usernames: `${user.usernames},${newUser.username}`}, {where: {user_id: newUser.id}}).then(() => {

                            // Send the embed to the mod log channel
                            actionLog.send({embeds: [usernameChangedEmbed]});
                        });

                    // If the member has no entry in the table, create one
                    } else {

                        // Create a new db entry
                        Models.nameChange.create({
                            user_id: newUser.id,
                            usernames: `${oldUser.username},${newUser.username}`,
                            discriminators: oldUser.discriminator
                        }).then(() => {
                            // Send the embed to the mod log channel
                            actionLog.send({embeds: [usernameChangedEmbed]});
                        })
                    }
                })
            });

        } else if(oldUser.discriminator !== newUser.discriminator) {

            // Create the embed
            const discriminatorChangedEmbed = new Discord.EmbedBuilder()
                .setColor(0x886ce4) //purple
                .setTitle(`Member Discriminator Changed`)
                .setAuthor({name: `${newUser.tag}`, iconURL: `${newUser.displayAvatarURL({dynamic:true})}`})
                .setDescription(`${newUser}'s discriminator was changed`)
                .addFields(
                    {name: `Member Edited`, value: `${newUser}`, inline: true},
                    {name: `Old Discriminator`, value: `${oldUser.discriminator}`, inline: true},
                    {name: `New Discriminator`, value: `${newUser.discriminator}`, inline: true},
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

                        // Update the discriminators field in the db entry
                        Models.nameChange.update({discriminators: `${user.discriminators},${newUser.discriminator}`}, {where: {user_id: newUser.id}}).then(() => {

                            // Send the embed to the mod log channel
                            actionLog.send({embeds: [discriminatorChangedEmbed]});
                        });

                    // If the member has no entry in the table, create one
                    } else {

                        // Create a new db entry
                        Models.nameChange.create({
                            user_id: newUser.id,
                            usernames: newUser.username,
                            discriminators: `${oldUser.discriminator},${newUser.discriminator}`
                        }).then(() => {
                            // Send the embed to the mod log channel
                            actionLog.send({embeds: [discriminatorChangedEmbed]});
                        })
                    }
                })
            });
        }
    }
}