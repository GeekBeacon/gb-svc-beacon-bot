// Import required files
const Discord = require(`discord.js`);
const ModerationController = require("../controllers/ModerationController");
const PermissionsController = require("../controllers/PermissionsController");

module.exports = {
    name: 'unban',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`unban`)
        .setDescription(`Remove a user's ban from the server!`)
        .addUserOption(option => 
            option.setName(`user`)
            .setDescription(`The id of the user you wish to unban.`)
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName(`reason`)
            .setDescription(`The reason you are unbanning this user.`)
            .setMinLength(3)
            .setRequired(true)
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);

        // If the command is not enabled, let the member know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});

        // If the command is enabled
        } else {
            // If the member doesn't have the proper permissions, let them know
            if (!approved) {
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

            // If the command is enabled and the user has permission to use it, proceed
            } else {
                ModerationController.unbanHandler(interaction);
            }
        }
    },
};
