// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

module.exports = {
    name: 'ban',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`ban`)
        .setDescription(`Ban a member from the server!`)
        .addUserOption(option => 
            option.setName(`user`)
            .setDescription(`The user you wish to ban.`)
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName(`reason`)
            .setDescription(`The reason you want to ban the user.`)
            .setMinLength(3)
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName(`duration`)
            .setDescription(`The duration of time you want to ban the user for.`)
            .setMinLength(2)
            .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName(`purge`)
            .setDescription(`The number of days to clear messages from the user (0-7).`)
            .setMinValue(1)
            .setMaxValue(7)
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
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this sommand!`, ephemeral: true});

            // If the member has the proper permissions for the command
            } else {
                // Call the ban handler from the moderation controller with required args
                ModerationController.banHandler(interaction);
            }
        }
    },
};
