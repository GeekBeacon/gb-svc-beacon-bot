// Import the required files
const Discord = require(`discord.js`);
const DatabaseController = require("../controllers/DatabaseController");

// Create a new module export
module.exports = {
    
    // Set config values
    name: `configjoinables`,
    enabled: true,
    // Set minimum staff level (available to ewverybody by default unless disabled)
    mod: false,
    super: true,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`configjoinables`)
    .setDescription(`Configure the server's joinable roles`)
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
    )
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Call the query handler from the database controller with required args
        DatabaseController.queryHandler(interaction);
    }
}