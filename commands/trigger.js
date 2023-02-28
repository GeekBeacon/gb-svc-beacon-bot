// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const TriggersController = require("../controllers/TriggersController");

// Create a new module export
module.exports = {
    
    // Set config values
    name: `trigger`,
    enabled: true,
    // Set minimum staff level (available to ewverybody by default unless disabled)
    mod: true,
    super: false,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`trigger`)
    .setDescription(`Configure the server's trigger list`)
    .addSubcommand(subcommand =>
        subcommand.setName(`list`)
            .setDescription(`Lists the currently enabled triggers.`)
            .addStringOption(option => 
                option.setName(`trigger`)
                    .setDescription(`The word or phrase to look up.`)
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`add`)
            .setDescription(`Add a trigger to the trigger list.`)
            .addStringOption(option => 
                option.setName(`trigger`)
                    .setDescription(`The word or phrase to add to the trigger list.`)
                    .setRequired(true)
            )
            .addStringOption(option => 
                option.setName(`severity`)
                    .setDescription(`The severity of the trigger being added.`)
                    .setRequired(true)
                    .addChoices(
                        {name: `Low`, value: `low`},
                        {name: `Medium`, value: `medium`},
                        {name: `High`, value: `high`}
                    )
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`remove`)
            .setDescription(`Remove a trigger from the trigger list.`)
            .addStringOption(option => 
                option.setName(`trigger`)
                    .setDescription(`The word or phrase to remove from the trigger list.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`enable`)
            .setDescription(`Enables a trigger from the trigger list.`)
            .addStringOption(option => 
                option.setName(`trigger`)
                    .setDescription(`The word or phrase to enable within the trigger list.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`disable`)
            .setDescription(`Disables a trigger from the trigger list.`)
            .addStringOption(option => 
                option.setName(`trigger`)
                    .setDescription(`The word or phrase to disable within the trigger list.`)
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
                // Call the trigger handler from the triggers controller with required args
                TriggersController.triggerHandler(interaction);
            }
        }
    }
}