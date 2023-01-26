// Import the required files
const Discord = require(`discord.js`);
const DatabaseController = require("../controllers/DatabaseController");

// Create a new module export
module.exports = {

    // Set config values
    name: 'testdb',
    enabled: true,
    mod: false,
    super: false,
    admin: true,
    
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
        if(this.enabled === true) {
            console.log(interaction.commandName)
            DatabaseController.queryHandler(interaction);
        } else {
            return interaction.reply(`Oopsie! This command is currently disabled!`);
        }
    }
}