// Import required files
const ModerationController = require("../controllers/ModerationController");
const Discord = require(`discord.js`);

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
        // Call the query handler from the database controller with required args
        ModerationController.nicknameHandler(interaction);
    },
};
