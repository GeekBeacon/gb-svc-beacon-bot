// Import the required files
const JoinableRole = require("../models/JoinableRole");
const Discord = require("discord.js");

// Create a new module export
module.exports = {

    // Create a function with required args
    joinablesHandler: async function(interaction) {
        // Create vars
        const command = interaction.commandName;
        const superRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.member.roles.cache.some(role => role.id === interaction.client.settings.get("admin_role_id"));
        const ownerRole = await interaction.member.guild.fetchOwner;
        const superChannel = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("super_channel_name"))));
        const subcommand = interaction.options.getSubcommand()
        const role = interaction.options.getRole(`role`);

        let joinableRole;

        // List roles command
        if(subcommand === `list`) {

            let joinableRoles = [];

            // Get all rows and add their role to the joinable roles arr
            JoinableRole.findAll().then((data) => {
                data.forEach((item) => {
                    joinableRoles.push(item.get('role'));
                });
            // Send the joinable roles to the channel
            }).then(() => {
                interaction.reply({content: '**Joinable Roles:** '+joinableRoles.map(role => `\`${role}\``).join(', '), ephemeral: true});
            });

        // Add or leave commands
        } else if (subcommand === "join" || subcommand === "leave") {
            const joinedRole = interaction.member.roles.cache.some(r => r.name.includes(role.name)); // Look for role in user's current roles

            // If the user tried a join a role they are already in
            if (subcommand === "join" && joinedRole) {
                // Let the user know they're already in the role
                return interaction.reply({content: `You are already in that role!`, ephemeral: true});

            // If the user tried to leave a role they aren't in
            } else if (subcommand === "leave" && !joinedRole) {
                // Let the user know they aren't in that role
                return interaction.reply({content: `You are not in that role!`, ephemeral: true});
            } else {
                // Get all rows and add their role to the joinable roles arr
                JoinableRole.findOne({where: {role: role.name},raw:true}).then((data) => {
                    // If a role was found in the db add it to/remove it from the user
                    if (data) {
                        if (subcommand === "join") {

                            // Check if the role is part of the Squirrel Army
                            if(role.name.toLowerCase().includes("squirrel")) {

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
                                interaction.reply({content: `**Warning:** ${role.name} is part of our *Squirrel Army*, this section of GeekBeacon focuses on mental health and many users within this group are sensitive to certain situations.\nPlease be careful with how you approach these precious users.\n\n**Disclaimer: GeekBeacon is NOT a professional or liscensed mental health company nor do we have any on our staff team!**\n\nDo you still wish to join the ${role.name}?`, ephemeral: true, components: [btns], fetchReply: true})
                                    .then(async (msg) => {

                                        // Create the collector to capture the button clicks
                                        const btnCollector = await msg.createMessageComponentCollector({componentType: Discord.ComponentType.Button, max:1,  time:60000});

                                        // When a button is clicked
                                        btnCollector.on(`collect`, i => {
                                            // If the user agreed to continue
                                            if(i.customId === "yes") {

                                                i.member.roles.add(role); // add the role
                                                return i.reply({content: `$You've been successfully added to the ${role.name} role!`, ephemeral: true});

                                            // If the user wanted to abort
                                            } else {
                                                return i.reply(`Got it! I have aborted this function. You have not been added to the ${role.name} role!.`);
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
                            // If the role wasn't part of the Squirrel Army
                            } else {
                                interaction.member.roles.add(role); // add the role
                                return interaction.reply({content: `You've been successfully added to the ${role.name} role!`, ephemeral: true});
                            }
                        // If the user asked to leave a role
                        } else if (subcommand === "leave") {
                            interaction.member.roles.remove(role); // remove the role
                            return interaction.reply({content: `You've have successfully left the ${role.name} role!`, ephemeral: true});
                        }

                    // If no role was found in the db let user know
                    } else {
                        // If join subcommand
                        if (subcommand === "join") {
                            return interaction.reply({content: `That role isn't joinable, please try another role!`, ephemeral: true});
                        // If leave subcommand
                        } else {
                            return interaction.reply({content: `You cannot leave that role, please try another role!`, ephemeral: true});
                        }
                    }
                // If no joinable roles were found
                }).catch(() => {
                    return interaction.reply({content: `Uh oh! It seems there are no joinable roles at this time!`, ephemeral: true});
                });
            }
        } else if (subcommand === "add" || subcommand === "remove") {
            // Do the stuff
        }

        if (command.name === 'addjoinablerole' && (superRole || adminRole || interaction.member === ownerRole)) {

                // Check if the role has special permissions
                if(role.permissions.any(client.settings.get("special_permission_flags").split(","))) {
                    return message.reply(`Uh oh! It seems that \`${joinableRole}\` has moderator or special permissions, please check to make sure you have the right role!`)
                }

                // Create a filter for the message collector
                const filter = m => {
                    // If user says "yes" or "no" then return true
                    if(m.author.id === message.author.id && (m.content.toLowerCase() === "yes" || m.content.toLowerCase() === "no")) {
                        return true;
                    }
                }

                // Ask the user if that is the right role they want to add
                message.channel.send(`Is \`${role.name}\` the right role you wish to add?\nPlease answer with either **yes** or **no**!`).then(() => {

                    // Listen for the user's response; giving them 10 seconds to reply
                    message.channel.awaitMessages({filter, max: 1, maxprocessed: 1, idle: 10000, errors:["idle"]}).then(res => {
                        // If the reply was "yes" then proceed with adding the role
                        if(res.first().content.toLowerCase() === "yes") {
                            /* 
                            * Sync the model to the table
                            * Creates a new table if table doesn't exist, otherwise just inserts new row
                            * id, createdAt, and updatedAt are set by default; DO NOT ADD
                            !!!!
                                Keep force set to false otherwise it will overwrite the table instead of making new row!
                            !!!!
                            */
                            JoinableRole.sync({ force: false }).then(() => {
                                // Query the database for the joinable role
                                JoinableRole.findOne({where:{role: role.name}}).then((jrole) => {
                                    // If there is no joinable role add it
                                    if (!jrole) {
                                        JoinableRole.create({
                                            role: role.name, // add the role string to the role column
                                            user_id: message.author.id // add the creator's id
                                        })
                                        // Let the user know it was added
                                        .then(() => {
                                            message.channel.send(`I have successfully added \`${role.name}\` to the joinable roles!\nNote: If you wish to add this role to an reaction role post then please run ${prefix}emojirole add!`);
                                        });
                                    // If there was a role, let user know it exists already
                                    } else {
                                        message.channel.send(`It looks like \`${role.name}\` has already been added!`);
                                    };
                                }).catch((err) => {
                                    console.error("Error: "+err);
                                });
                            });
                            // If the reply was "no" then abandon the process
                        } else if(res.first().content.toLowerCase() === "no") {
                            message.reply(`I have not added that role to the joinableroles list!`)
                        }
                    // If the user goes idle for 10 seconds let them know they timed out
                    }).catch(e => {
                        message.reply(`Uh oh! It seems that you got distracted, please try again!`)
                    });
                });

        /*********** REMOVE JOINABLE ROLE ***********/
        } else if (command.name === 'removejoinablerole' && (superRole || adminRole || ownerRole)) {
            // Find the role within the guild
            const role = message.guild.roles.cache.find(role => role.name.toLowerCase().includes(joinableRole.toLowerCase()));

            // If the role doesn't exist let the user know
            if(!role) {
                return message.reply(`Uh oh! Looks like you either tried to add a role that doesn't exist or used a role id or mention. Please tell me the name of the role instead!`);
            }

            // Query the database for the joinable role passed in
            JoinableRole.findOne({where: {role: role.name}}).then((jrole) => {
                // If the joinable role was found, then remove it
                if (jrole) {
                    JoinableRole.destroy({
                        where: {
                            role: jrole.get("role")
                        }
                    // Let the user know it was removed
                    }).then(() => {
                        message.channel.send(`I have successfully removed \`${jrole.get('role')}\` from the joinable roles!\nNote: If you wish to remove this role to an reaction role post then please run ${prefix}emojirole remove!`);
                    });
                // If the joinable role wasn't found let the user know
                } else {
                    message.channel.send(`Unable to find \`${joinableRole}\`, please try again or use \`${prefix}listjoinableroles\` to view all joinable roles in the list!`);
                };
            });
        };

    }
}