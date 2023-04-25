// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require(`../controllers/PermissionsController`);
const UserController = require(`../controllers/UserController`);

// Create a new module export
module.exports = {
    name: "namechanges",
    enabled: true,
    mod: true, // Minimum level required is Mod
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`namechanges`)
        .setDescription(`View user specific or recent namechanges!`)
        .addSubcommand(subcommand => 
            subcommand.setName(`recent`)
            .setDescription(`Get the 10 most recent updated users`)
            .addIntegerOption(option => 
                option.setName(`amount`)
                .setDescription(`The number of logs to get.`)
                .setMinValue(1)
                .setMaxValue(20)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`user`)
            .setDescription(`Get the name changes for a specific user.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The user you want to get name changes for.`)
                .setRequired(true)
            )
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);

        // If the command is disabled, let the user know
        if (!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});

        // If the member doesn't have the proper permissions
        } else if (!approved) {
            return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

        // If the member has the proper permissions
        } else {
            // Call the listChanges function from the UserController file
            UserController.listChanges(interaction);
        }
    }
}