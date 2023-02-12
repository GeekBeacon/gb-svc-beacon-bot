// Import required files
const DatabaseController = require("../controllers/DatabaseController");
const Discord = require(`discord.js`);

module.exports = {
    name: 'slow',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`slow`)
        .setDescription(`Toggles slowmode on or off for a specific channel.`)
        .addChannelOption(option => 
            option.setName(`channel`)
            .setDescription(`The channel to toggle slow mode for.`)
            .setRequired(true)    
        )
        .addIntegerOption(option => 
            option.setName(`interval`)
            .setDescription(`The amount of time the user must wait per second.`)
            .setMinValue(0)
            .setMaxValue(21600)
            .setRequired(true)
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        // Call the queryHandler function from the database controller with required args
        DatabaseController.queryHandler(interaction);
    },
};
