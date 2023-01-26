// Import required files
const Discord = require("discord.js");

module.exports = {

    // Set config values
    name: 'github',
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    
    //Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`github`)
    .setDescription(`Posts a link to this Bot's Github repository!`),
    // Execute the command
    async execute(interaction) {
        // Send the link to the bot's repo
        interaction.reply(`Hello!\n\nMy name is BeaconBot and I live here: https://github.com/GeekBeacon/gb-svc-beacon-bot !`)
    }
}
