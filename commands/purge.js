// Import required files
const DatabaseController = require("../controllers/DatabaseController");
const Discord = require(`discord.js`);

module.exports = {

    // Set config values
    name: 'purge',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    // Build the slash command
    data: new Discord.SlashCommandBuilder()
    .setName(`purge`)
    .setDescription(`Deletes a large amount of messages (2-100), optionally specifying a specific channel.`)
    .addIntegerOption(option => 
        option.setName(`amount`)
        .setDescription(`The number of messages to purge.`)
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(100)
    )
    .addChannelOption(option => 
        option.setName(`channel`)
        .setDescription(`The channel to purge.`)
        .setRequired(false)    
    )
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Set this command's property values to the local collection's property values
        this.enabled = interaction.client.commands.get(this.name).enabled;
        this.mod = interaction.client.commands.get(this.name).mod;
        this.super = interaction.client.commands.get(this.name).super;
        this.admin = interaction.client.commands.get(this.name).admin;

        // If the command is disabled, let the user know
        if(this.disabled == true) return interaction.reply({content: `Uh oh! This commend is currently disabled!`, ephemeral: true});

        // Call the query handler from the database controller with required args
        DatabaseController.queryHandler(interaction);
    },
};
