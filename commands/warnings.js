// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");
const WarningsController = require("../controllers/WarningsController");

// Create a new module export
module.exports = {
    name: "warnings",
    enabled: true,
    mod: true, // Minimum level required is Mod
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`warnings`)
        .setDescription(`View or assign warnings!`)
        .addSubcommand(subcommand => 
            subcommand.setName(`recent`)
            .setDescription(`Get the most recent warnings.`)
            .addIntegerOption(option => 
                option.setName(`amount`)
                .setDescription(`The number of warnings to get.`)
                .setMinValue(1)
                .setMaxValue(20)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`user`)
            .setDescription(`Get the warnings for a specific user.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The user you want to get warnings for.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`specific`)
            .setDescription(`Get information on a specific warning.`)
            .addIntegerOption(option => 
                option.setName(`id`)
                .setDescription(`The id of the warning you want to see.`)
                .setMinValue(1)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`new`)
            .setDescription(`Give a new warning to a user.`)
            .addUserOption(option =>
                option.setName(`user`)
                .setDescription(`The user you want to warn.`)
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName(`reason`)
                .setDescription(`The reason you are warning the user.`)
                .setMaxLength(1024)
                .setRequired(true)
            )
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);
        const subcommand = interaction.options.getSubcommand(); //get the subcommand

        // If the command is disabled, let the user know
        if (!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});

        // If the member doesn't have the proper permissions
        } else if (!approved) {
            return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

        // If the member has the proper permissions
        } else {
            // If the user is assigning a new warning
            if (subcommand === `new`) {
                // Call the warn handler function from the ModerationController file
                ModerationController.warnHandler(interaction);
                
            // If the user is wanting to view warnings
            } else {
                // Call the warning handler function from the WarningsController file
                WarningsController.warningHandler(interaction);
            }
        }
    }
}