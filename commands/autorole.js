// Import the required files
const PermissionsController = require("../controllers/PermissionsController");
const Discord = require(`discord.js`);
const AutorolesController = require("../controllers/AutorolesController");

module.exports = {

    // Set config values
    name: 'autorole',
    enabled: true,
    mod: false,
    super: true,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`autorole`)
    .setDescription(`Add, remove, or list the server's autoroles`)
    .addSubcommand(subcommand =>
        subcommand.setName(`list`)
            .setDescription(`Lists the current autoroles.`)
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`add`)
            .setDescription(`Add a role to the autoroles.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to add to the autoroles.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`remove`)
            .setDescription(`Remove a role to the autoroles.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to remove from the autoroles.`)
                    .setRequired(true)
            )
    )
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);
        const subcommand = interaction.options.getSubcommand(); //get the subcommand

        // If the command is disabled then let the member know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});

        // If the command isn't disabled, proceed
        } else {

            // If the user didn't trigger the list command
            if(subcommand !== `list`) {

                // If the user doesn't have the appropiate role for the command, let them know
                if(!approved) {
                    return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

                // If the user has the appropiate role
                } else {
                    // Call the autorole handler from the autorole controller
                    AutorolesController.autoroleHandler(interaction);
                }
            // If the user only asked for the autoroles to be listed
            } else {
                // Call the autorole handler from the autorole controller
                AutorolesController.autoroleHandler(interaction);
            }
        }
    }
}