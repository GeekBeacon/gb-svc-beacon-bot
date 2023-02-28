// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController")
const ModerationController = require("../controllers/ModerationController");

module.exports = {

    // Set config values
    name: 'purge',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    // Build the slash command
    data: new Discord.SlashCommandBuilder()
    .setName(`purge`)
    .setDescription(`Deletes a large amount of messages (2-100), optionally specifying a specific channel.`)
    .addIntegerOption(option => 
        option.setName(`amount`)
        .setDescription(`The number of messages to purge.`)
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(100)
    )
    .addChannelOption(option => 
        option.setName(`channel`)
        .setDescription(`The channel to purge.`)
        .setRequired(false)    
    )
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

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
                // Call the purge handler from the moderation controller with required args
                ModerationController.purgeHandler(interaction);
            }
        }
    },
};
