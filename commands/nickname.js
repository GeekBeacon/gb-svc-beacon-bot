// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

module.exports = {
    name: 'nickname',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`nickname`)
        .setDescription(`Modify a member's nickname`)
        .addSubcommand(subcommand =>
            subcommand.setName(`set`)
            .setDescription(`Change the member's nickname`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you are wanting to modify.`)
                .setRequired(true)
            )
            .addStringOption(option =>
                option.setName(`nickname`)
                .setDescription(`The new nickname for the member.`)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(32)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`reset`)
            .setDescription(`Resets a member's nickname back to their Discord username.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you are wanting to modify.`)
                .setRequired(true)
            )
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
            // If the member doesn't have the proper permissions for the subcommand
            if(!approved) {
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this subcommand!`, ephemeral: true});

            // If the member has the proper permissions for the subcommand
            } else {
                // Call the nickname handler from the moderation controller with required args
                ModerationController.nicknameHandler(interaction);
            }
        }
    },
};
