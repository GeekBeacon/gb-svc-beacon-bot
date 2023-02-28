const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");

module.exports = {

    // Set config values
    name: 'roleinfo',
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    
    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`roleinfo`)
    .setDescription(`Get information about a specific role!`)
    .addRoleOption(option =>
        option
        .setName(`role`)
        .setDescription(`The role you want info about.`)
        .setRequired(true)
        ),
    // Execute the command
    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);
        
        // If the command is disabled then let the user know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});
        // If the command isn't disabled, proceed
        } else {
            // If the member doesn't have the proper permissions for the command
            if(!approved) {
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

            // If the member has the proper permissions for the command
            } else {

                const role = interaction.options.getRole(`role`); //get the role the user provided
                let memberCount = 0;

                // Get the member count
                role.members.forEach(() => {
                    memberCount++;
                });

                // Create the embed
                const roleEmbed = {
                    color: `${role.color}`,
                    description: `Information for the ${role} role`,
                    fields: [
                        {
                            name: `Members`,
                            value: `${memberCount}`,
                            inline: true,
                        },
                        {
                            name: `Color`,
                            value: `${role.hexColor}`,
                            inline: true,
                        },
                        {
                            name: `Mentionable`,
                            value: `${role.mentionable}`,
                            inline: true,
                        },
                        {
                            name: `Hoisted`,
                            value: `${role.hoist}`,
                            inline: true,
                        },
                        {
                            name: `Managed Externally`,
                            value: `${role.managed}`,
                            inline: true,
                        },
                        {
                            name: `Position`,
                            value: `${role.position +1}`, //add 1 to make it human readable
                            inline: true,
                        },
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: `Role ID: ${role.id}`
                    },
                };

                // Send the embed
                interaction.reply({embeds: [roleEmbed]});
            }
        }

        
    }
}