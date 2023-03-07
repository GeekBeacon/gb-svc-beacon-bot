// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");

module.exports = {

    // Set config values
    name: 'coinflip',
    enabled: true,
    mod: false,
    super: false,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`rng`)
    .setDescription(`Generate a random number!`)
    .addIntegerOption(option => 
        option.setName(`min`)
        .setDescription(`The minimum number value.`)
        .setRequired(true)
    )
    .addIntegerOption(option => 
        option.setName(`max`)
        .setDescription(`The maximum number value.`)
        .setRequired(true)
    ),

    // Execute the command
    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);

        // If the command is not enabled, let the member know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});
        // If the member doesn't have the proper permissions, let them know
        } else if (!approved) {
            return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});
        // If the command is enabled and the user has permission to use it
        } else {
            const min = interaction.options.getInteger(`min`);
            const max = interaction.options.getInteger(`max`);
            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            await interaction.reply({content: `Generating random number...`, ephemeral: true, fetchReply: true});
            setTimeout(function () {
                interaction.editReply({content: `Your number is: \`${result}\`!`});
            }, 1500)
        }
    }
};
