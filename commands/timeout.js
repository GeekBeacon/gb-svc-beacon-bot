// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

module.exports = {
    name: 'timeout',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`timeout`)
        .setDescription(`Prevents a member from using voice, text, and reactions!`)
        .addSubcommand(subcommand => 
            subcommand.setName(`add`)
            .setDescription(`Put a member in timeout.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you want to put in timeout.`)
                .setRequired(true)
            )
            .addIntegerOption(option => 
                option.setName(`duration`)
                .setDescription(`How many minutes you want to keep the member in timeout.`)
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)
            )
            .addStringOption(option => 
                option.setName(`reason`)
                .setDescription(`The reason you are putting the member into timeout.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`remove`)
            .setDescription(`Remove a member from timeout.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you want to remove from timeout.`)
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName(`reason`)
                .setDescription(`The reason you are removing the member from timeout.`)
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
                // Call the timeout handler from the moderation controller with required args
                ModerationController.timeoutHandler(interaction);
            }
        }
    },
};
