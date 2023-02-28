// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

module.exports = {
    name: 'tempvoice',
    enabled: true,
    mod: false,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`tempvoice`)
        .setDescription(`Create a temp voice channel that will activate once a member joins then deleted once empty!`)
        .addStringOption(option => 
            option.setName(`name`)
            .setDescription(`The name of the channel`)
            .setMinLength(5)
            .setMaxLength(100)
            .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName(`limit`)
            .setDescription(`Optional member limit for the channel.`)
            .setMinValue(2)
            .setMaxValue(99)
            .setRequired(false)
        ),

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
                // Call the temp voice handler from the moderation controller with required args
                ModerationController.tempVoiceHandler(interaction);
            }
        }
    },
};
