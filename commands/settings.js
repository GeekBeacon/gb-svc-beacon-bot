// Import required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const DatabaseController = require("../controllers/DatabaseController");

module.exports = {
    name: 'settings',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    // Build the slash command
    data: new Discord.SlashCommandBuilder()
        .setName(`settings`)
        .setDescription(`Display or change the different variable settings that BeaconBot uses.`)
        .addSubcommand(subcommand => 
            subcommand.setName(`list`)
                .setDescription(`List all of the settings.`)
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`view`)
                .setDescription(`View a specific setting.`)
                    .addStringOption(option => 
                        option.setName(`setting`)
                            .setDescription(`The setting you want to view. Start typing to narrow results!`)
                            .setRequired(true)
                            .setAutocomplete(true)
                        )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`update`)
                .setDescription(`Update a specific setting's value.`)
                    .addStringOption(option => 
                        option.setName(`setting`)
                            .setDescription(`The setting you want to update. Start typing to narrow results!`)
                            .setRequired(true)
                            .setAutocomplete(true)
                        )
        ),

    // Handle the autocompletion
    async autocomplete(interaction) {
        // Get the focused option's value
        const focusedValue = interaction.options.getFocused();
        const choices = [`admin_role_id`,`super_role_id`,`mod_role_id`,`trainee_role_id`,`user_role_id`,`admin_channel_name`,`super_channel_name`,`mod_channel_name`,`super_log_channel_name`,`mod_log_channel_name`,`join_log_channel_name`,`excluded_channels`,`url_role_whitelist`,`special_permission_flags`,`level_1_role_id`,`level_2_role_id`,`level_3_role_id`,`level_4_role_id`,`level_5_role_id`];
        
        // Filter the choices to find any option that includes the member's input
        const filtered = choices.filter(choice => choice.includes(focusedValue));

        // Send the results to Discord to display to the member
        await interaction.respond(
            // Map the array into an object that will be accepted
            filtered.map(choice => ({name: choice, value: choice})),
        );
    },

    // Execute the command
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
                DatabaseController.settingsHandler(interaction);
            }
        }

    }
};
