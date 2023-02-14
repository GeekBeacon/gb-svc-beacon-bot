// Import required files
const ModerationController = require("../controllers/ModerationController");
const Discord = require(`discord.js`);

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
        // Call the role handler from the moderation controller with required args
        ModerationController.roleHandler(interaction);
    },
};
