// Import the required files
const Discord = require(`discord.js`);
const DatabaseController = require("../controllers/DatabaseController");

// Create a new module export
module.exports = {
    
    // Set config values
    name: `joinable`,
    enabled: true,
    // Set minimum staff level (available to ewverybody by default unless disabled)
    mod: false,
    super: false,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`joinable`)
    .setDescription(`Join, leave, or configure joinable roles for the server!`)
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
            .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ViewGuildInsights)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to add to the list of joinable roles.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`remove`)
            .setDescription(`Removes a role from being joinable.`)
            .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ViewGuildInsights)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to remove from the list of joinable roles.`)
                    .setRequired(true)
            )
    ),

    async execute(interaction) {
        // Call the query handler from the database controller with required args
        //DatabaseController.queryHandler(interaction);
    }
}