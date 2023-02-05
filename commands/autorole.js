// Import the required files
const DatabaseController = require("../controllers/DatabaseController");
const Discord = require(`discord.js`);

module.exports = {

    // Set config values
    name: 'autorole',
    enabled: true,
    mod: false,
    super: true,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`autorole`)
    .setDescription(`Add, remove, or list the server's autoroles`)
    .addSubcommand(subcommand =>
        subcommand.setName(`list`)
            .setDescription(`Lists the current autoroles.`)
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`add`)
            .setDescription(`Add a role to the autoroles.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to add to the autoroles.`)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`remove`)
            .setDescription(`Remove a role to the autoroles.`)
            .addRoleOption(option => 
                option.setName(`role`)
                    .setDescription(`The role to remove from the autoroles.`)
                    .setRequired(true)
            )
    ),

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

            // If the user didn't trigger the list command
            if(interaction.options.getSubcommand() !== `list`) {
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
                    // Call the query handler from the database controller with required args
                    DatabaseController.queryHandler(interaction);
                }
            // If the user only asked for the autoroles to be listed
            } else {
                // Call the query handler from the database controller with required args
                DatabaseController.queryHandler(interaction);
            }
        }
    }
}