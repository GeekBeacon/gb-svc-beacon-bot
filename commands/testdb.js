// Import the required files
const Discord = require(`discord.js`);
const DatabaseController = require("../controllers/DatabaseController");

// Create a new module export
module.exports = {

    data: new Discord.SlashCommandBuilder()
    .setName(`testdb`)
    .setDescription(`Runs a test to ensure the database is properly connected!`)
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        DatabaseController.queryHandler(interaction);
    }
}