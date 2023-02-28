// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require(`../controllers/PermissionsController`);
const ModerationController = require("../controllers/ModerationController");

module.exports = {
    name: 'bans',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`bans`)
        .setDescription(`Get information on a specific ban or the 10 most recent bans.`)
        .addSubcommand(subcommand => 
            subcommand.setName(`recent`)
            .setDescription(`List the 10 most recent bans.`)
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`specific`)
            .setDescription(`Get information on a specific ban.`)
                .addIntegerOption(option => 
                    option.setName(`id`)
                    .setDescription(`The id of the ban you want to lookup.`)
                    .setMinValue(1)
                    .setRequired(true)
                )
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
                ModerationController.listBans(interaction);
            }
        }
        
    },
};
