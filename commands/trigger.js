// Import the required files
const Discord = require(`discord.js`);
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
        
        // Set this command's property values to the local collection's property values
        this.enabled = interaction.client.commands.get(this.name).enabled;
        this.mod = interaction.client.commands.get(this.name).mod;
        this.super = interaction.client.commands.get(this.name).super;
        this.admin = interaction.client.commands.get(this.name).admin;

        // If the command is disabled then let the user know
        if(this.enabled === false) {
            return interaction.reply({content: `Uh oh! This commend is currently disabled!`, ephemeral: true});

        // If the command isn't disabled, proceed
        } else {

            const subcommand = interaction.options.getSubcommand();

            // If the member used a public subcommand
            if(subcommand === "list" || subcommand === "join" || subcommand === "leave") {
                // Call the query handler from the triggers controller with required args
                TriggersController.triggerHandler(interaction);

            // If the member tried to use a super command
            } else {
                // Check if the user is in any of the mod+ roles
                const trainee = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("trainee_role_id"));
                const mod = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("mod_role_id"));
                const superMod = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("super_role_id"));
                const admin = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("admin_role_id"));

                // If the user doesn't have the appropiate role for the command, let them know
                if(this.admin === true && !admin) {
                    return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this subcommand!`, ephemeral: true});
                } else if(this.super === true && !(superMod || admin)) {
                    return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this subcommand!`, ephemeral: true});
                } else if(this.mod === true && !(admin || superMod || mod || trainee)) {
                    return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this subcommand!`, ephemeral: true});

                // If the user has the appropiate role
                } else {
                    // Call the query handler from the triggers controller with required args
                    TriggersController.triggerHandler(interaction);
                }
            }
        }
    }
}