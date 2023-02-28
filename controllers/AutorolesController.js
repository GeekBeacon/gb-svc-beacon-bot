// Import the required files
const AutoRole = require("../models/AutoRole");
const Discord = require("discord.js");

// Create a new module export
module.exports = {

    // Create a function with required args
    autoroleHandler: function(interaction) {
        // Create vars
        const autoRoleAction = interaction.options.getSubcommand();

        /*********** ADD AUTOROLE ***********/
        if (autoRoleAction === 'add') {
            // Get the role the user passed in
            const role = interaction.options.getRole(`role`);

            // Check if the role has special permissions
            if(role.permissions.any(interaction.client.settings.get("special_permission_flags").split(","))) {
                return interaction.reply(`Uh oh! It seems that \`${role}\` has moderator or special permissions, please check to make sure you have the right role!`)
            }

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
                AutoRole.findOne({where:{role: role.name}}).then((arole) => {
                    // If there is no autorole add it
                    if (!arole) {
                        AutoRole.create({
                            role: role.name, // add the role string to the role column
                            user_id: interaction.user.id // add the creator's id
                        })
                        // Let the user know it was added
                        .then(() => {
                            interaction.reply(`I have successfully added \`${role.name}\` to the autorole list!`);
                        });
                    // If there was a role, let user know it exists already
                    } else {
                        interaction.channel.send(`It looks like \`${role.name}\` has already been added as an autorole!`);
                    };
                }).catch((err) => {
                    console.error("Error: "+err);
                });
            });

        /*********** REMOVE AUTOROLE ***********/
        } else if (autoRoleAction === 'remove') {
            // Get the role the user passed in
            const role = interaction.options.getRole(`role`);

            // Query the database for the autorole passed in
            AutoRole.findOne({where: {role: role.name}}).then((arole) => {
                // If the autorole was found, then remove it
                if (arole) {
                    AutoRole.destroy({
                        where: {
                            role: arole.get("role")
                        }
                    // Let the user know it was removed
                    }).then(() => {
                        interaction.reply(`I have successfully removed \`${arole.get('role')}\` from the autorole list!`);
                    });
                // If the autorole wasn't found let the user know
                } else {
                    interaction.reply(`Unable to find \`${autorole}\`, please try again or use \`${prefix}listautoroles\` to view all autoroles in the list!`);
                };
            });

        /*********** LIST AUTOROLES ***********/
        } else if (autoRoleAction === 'list') {

            let autoroles = [];

            // Get all rows and add their role to the autoroles arr
            AutoRole.findAll().then((data) => {
                data.forEach((item) => {
                    autoroles.push(item.get('role'));
                });
            // Send the autoroles to the user
            }).then(() => {
                interaction.reply('**Autoroles:** '+autoroles.map(role => `\`${role}\``).join(', '))
            });
        };

    }
}