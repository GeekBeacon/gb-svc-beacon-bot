// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const DatabaseController = require("../controllers/DatabaseController");

// Create a new module export
module.exports = {
    
    // Set config values
    name: `testdb`,
    enabled: true,
    // Set minimum staff level (available to ewverybody by default unless disabled)
    mod: false,
    super: false,
    admin: true,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`testdb`)
    .setDescription(`Runs a test to ensure the database is properly connected!`)
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),
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
                // Call the query handler from the database controller with required args
                DatabaseController.queryHandler(interaction);
            }
        }
    }
}