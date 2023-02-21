// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const ModerationController = require("../controllers/ModerationController");

// Create a new module export
module.exports = {
    name: "blacklist",
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`blacklist`)
        .setDescription(`Add, remove, or list banned domains!`)
        .addSubcommand(subcommand => 
            subcommand.setName(`add`)
            .setDescription(`Add a domain to the blacklist.`)
            .addStringOption(option => 
                option.setName(`domain`)
                .setDescription(`The domain you want to blacklist.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`remove`)
            .setDescription(`Remove a domain to the blacklist.`)
            .addStringOption(option => 
                option.setName(`domain`)
                .setDescription(`The domain you want to remove.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`list`)
            .setDescription(`List the domains in the blacklist.`)
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
                // Call the blacklist handler from the moderation controller with required args
                ModerationController.blacklistHandler(interaction);
            }
        }
    }
}