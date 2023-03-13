// Import required files
const Discord = require("discord.js");
const PermissionsController = require("../controllers/PermissionsController");

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
                // Send the link to the bot's repo
                interaction.reply(`Hello!\n\nMy name is BeaconBot and I live in my very own [repository](https://github.com/GeekBeacon/gb-svc-beacon-bot "Click to visit me!") over on Github!`);
            }
        }
        
        
    }
}
