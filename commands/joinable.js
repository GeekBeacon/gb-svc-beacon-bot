// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const JoinableRolesController = require("../controllers/JoinableRolesController");

// Create a new module export
module.exports = {
    
    // Set config values
    name: `joinable`,
    enabled: true,
    // Set minimum staff level (available to ewverybody by default unless disabled)
    mod: false,
    super: true,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`joinable`)
    .setDescription(`List, join, leave, or configure the server's joinable roles!`)
    .addSubcommand(subcommand =>
        subcommand.setName(`list`)
            .setDescription(`List all of the joinable roles.`)
    )
    .addSubcommand(subcommand =>
        subcommand.setName(`join`)
            .setDescription(`Join a joinable role.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role you wish to join.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`leave`)
            .setDescription(`Leave a joinable role.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role you wish to leave.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`add`)
            .setDescription(`Adds a role to be joinable.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to add to the list of joinable roles.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`remove`)
            .setDescription(`Removes a role from being joinable.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to remove from the list of joinable roles.`)
                    .setRequired(true)
            )
    ),

    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);
        const subcommand = interaction.options.getSubcommand(); //get the subcommand

        // If the command is not enabled, let the member know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This commend is currently disabled!`, ephemeral: true});

        // If the member used a public subcommand, proceed
        } else if (subcommand === "list" || subcommand === "join" || subcommand === "leave") {
            JoinableRolesController.joinablesHandler(interaction);

        // If the member doesn't have the proper permissions, let them know
        } else if (!approved) {
            return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this subcommand!`, ephemeral: true});

        // If the command is enabled and the user has permission to use it, proceed
        } else {
            JoinableRolesController.joinablesHandler(interaction);
        }
    }
}