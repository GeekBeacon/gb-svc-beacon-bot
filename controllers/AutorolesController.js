// Import the required files
const moment = require('moment');
const {prefix} = require('../config');
const AutoRole = require("../models/AutoRole");

// Create a new module export
module.exports = {

    // Create a function with required args
    autoroleHandler: function(cmd, c, a, m) {
        // Create vars
        const command = cmd, client = c, args = a, message = m;
        let autorole;
            
        // Check the length of the args
        if (args.length > 1) {
            // If more than 1 arg, join to create a string, make lowercase, and assign to autorole
            autorole = args.join(" ").toLowerCase();
        } else if (args.length === 1) {
            // If only 1 arg then assign it to autorole
            autorole = args[0].toLowerCase();
        };

        /*********** ADD AUTOROLE ***********/
        if (command.name === 'addautorole') {
            // Search for the role within the server
            const role = message.guild.roles.cache.find(role => role.name.toLowerCase() === autorole);
            
            // Check if the role exists
            if (role) {
                /* 
                * Sync the model to the table
                * Creates a new table if table doesn't exist, otherwise just inserts new row
                * id, createdAt, and updatedAt are set by default; DO NOT ADD
                !!!!
                    Keep force set to false otherwise it will overwrite the table instead of making new row!
                !!!!
                */
                AutoRole.sync({ force: false }).then(() => {
                    // Query the database for the autorole
                    AutoRole.findOne({where:{role: autorole}}).then((ar) => {
                        // If there is no autorole add it
                        if (!ar) {
                            AutoRole.create({
                                role: role.name, // add the role string to the role column
                                user_id: message.author.id // add the creator's id
                            })
                            // Let the user know it was added
                            .then(() => {
                                message.channel.send(`I have successfully added \`${role.name}\` to the autorole list!`);
                            });
                        // If there was a role, let user know it exists already
                        } else {
                            message.channel.send(`It looks like \`${role.name}\` has already been added!`);
                        };
                    }).catch((err) => {
                        console.error("Error: "+err);
                    });
                });
            } else {
                message.reply(`it looks like that role (${autorole}) doesn't exist!`);
            };

        /*********** REMOVE AUTOROLE ***********/
        } else if (command.name === 'removeautorole') {
            // Find the role within the guild
            const role = message.guild.roles.cache.find(role => role.name.toLowerCase() === autorole);
            // Query the database for the autorole passed in
            AutoRole.findOne({where: {role: role.name}}).then((ar) => {
                // If the autorole was found, then remove it
                if (ar) {
                    AutoRole.destroy({
                        where: {
                            role: autorole
                        }
                    // Let the user know it was removed
                    }).then(() => {
                        message.channel.send(`I have successfully removed \`${ar.get('role')}\` from the autorole list!`);
                    });
                // If the autorole wasn't found let the user know
                } else {
                    message.channel.send(`Unable to find \`${autorole}\`, please try again or use \`${prefix}listautoroles\` to view all autoroles in the list!`);
                };
            });

        /*********** LIST AUTOROLES ***********/
        } else if (command.name === 'listautoroles') {
            // If user is a mod and didn't pass in any args, list autoroles
            if (message.member.hasPermission("KICK_MEMBERS") && !args.length) {
                let autoroles = [];

                // Get all rows and add their role to the autoroles arr
                AutoRole.findAll().then((data) => {
                    data.forEach((item) => {
                        autoroles.push(item.get('role'));
                    });
                // Send the autoroles to the user in a DM
                }).then(() => {
                    message.author.send('**Autoroles:** '+autoroles.map(role => `\`${role}\``).join(', '))
                    // Let user know they have been DMed
                    .then(() => {
                        if (message.channel.type === "dm") return;
                        message.reply("I've sent you a DM with all of the autoroles!");
                    })
                    // If failed to dm, let user know and ask if they have DMs disabled
                    .catch(error => {
                        message.reply("It seems like I can't DM you! Do you have DMs disables?");
                    });
                });

            // If user is a super mod and passed in args, then give all data about that autorole
            } else if (message.member.hasPermission("MANAGE_ROLES") && args.length) {
                // Find the role within the guild
                const role = message.guild.roles.cache.find(role => role.name.toLowerCase() === autorole);
                let autoroleData = {};

                // Get the data for the autorole
                AutoRole.findOne({where: {role: role.name}}).then((data) => {
                    autoroleData.id = data.get('id'); //get id
                    autoroleData.role = data.get('role'); //get role
                    autoroleData.creator = client.users.get(data.get('user_id')); //get user id
                    autoroleData.created = moment(data.get('createdAt')).format('YYYY-MM-DD HH:mm:ss'); //get created date in YYYY-MM-DD HH:mm:ss format
                    autoroleData.updated = moment(data.get('updatedAt')).format('YYYY-MM-DD HH:mm:ss'); //get updated date in YYYY-MM-DD HH:mm:ss format

                // Send the autorole to the user in a DM
                }).then(() => {
                    // Create the embed to send in a DM
                    const autoroleEmbed = {
                        color: 0x330066,
                        author: {
                            name: autoroleData.creator.username+'#'+autoroleData.creator.discriminator,
                            icon_url: autoroleData.creator.displayAvatarURL,
                        },

                        fields: [
                            {
                                name: 'Role',
                                value: autoroleData.role,
                                inline: false,
                            }
                        ],
                        footer: {
                            text: `Created: ${autoroleData.created} | Updated: ${autoroleData.updated}`
                        },

                    };

                    message.author.send({embed: autoroleEmbed})
                    // Let user know they have been DMed
                    .then(() => {
                        if (message.channel.type === "dm") return;
                        message.reply(`I've sent you a DM with the information on \`${autoroleData.role}\`!`);
                    })
                    // If failed to dm, let user know and ask if they have DMs disabled
                    .catch((err) => {
                        message.reply("it seems like I can't DM you! Do you have DMs disables?");
                    });
                }).catch((err) => {
                    message.reply(`it looks like \`${autorole}\` doesn't exist!`);
                });

            // If user isn't a super mod and passed in args let them know they can't use that command
            } else if (!message.member.hasPermission("MANAGE_ROLES") && args.length) {
                message.channel.send(`You do not have the proper permissions to use this command!\nIf you were trying to get the autorole list, use \`${prefix}listautoroles\``);
            };
        };

    }
}