// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

module.exports = {
    name: 'kick',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`kick`)
        .setDescription(`Kick a member from the server!`)
        .addUserOption(option => 
            option.setName(`user`)
            .setDescription(`The member you want to kick.`)
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName(`reason`)
            .setDescription(`The reason you want to kick the member.`)
            .setRequired(true)
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
                // Call the kick handler from the moderation controller with required args
                ModerationController.kickHandler(interaction);
            }
        }
    },
};
