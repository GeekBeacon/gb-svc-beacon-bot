// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

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
                // Call the command toggle handler from the moderation controller with required args
                ModerationController.cmdToggleHandler(interaction);
            }
        }
    }
};
