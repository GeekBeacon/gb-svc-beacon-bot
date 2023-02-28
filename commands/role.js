// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

module.exports = {
    name: 'role',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`role`)
        .setDescription(`Toggle a role for a member.`)
        .addSubcommand(subcommand => 
            subcommand.setName(`add`)
            .setDescription(`Give a role to a member.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you want to give the role to.`)
                .setRequired(true)
            )
            .addRoleOption(option => 
                option.setName(`role`)
                .setDescription(`The role you want to give to the member.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`remove`)
            .setDescription(`Remove a role from a member.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you want to remove the role from.`)
                .setRequired(true)
            )
            .addRoleOption(option => 
                option.setName(`role`)
                .setDescription(`The role you want to remove from the member.`)
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
            // If the member doesn't have the proper permissions for the command
            if(!approved) {
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

            // If the member has the proper permissions for the command
            } else {
                // Call the role handler from the moderation controller with required args
                ModerationController.roleHandler(interaction);
            }
        }
    },
};
