// Import required files
const DatabaseController = require("../controllers/DatabaseController");
const Discord = require(`discord.js`);

module.exports = {

    // Set config values
    name: 'cmdtoggle',
    enabled: true,
    mod: false,
    super: false,
    admin: true,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`cmdtoggle`)
    .setDescription(`Toggle commands on or off!`)
    .addStringOption(option => 
        option
            .setName(`command`)
            .setDescription(`The command to toggle.`)
            .setRequired(true)
            .setMinLength(3)
    )
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Call the query handler from the database controller with required args
        DatabaseController.queryHandler(interaction);
    }
};
