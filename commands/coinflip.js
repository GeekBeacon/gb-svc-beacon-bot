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
    .setName(`coinflip`)
    .setDescription(`Flip a coin!`),

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
            const choices = ["heads", "tails"];
            const result = choices[Math.floor(Math.random() * choices.length)];

            await interaction.reply({content: `Flipping coin...`, ephemeral: true, fetchReply: true});
            setTimeout(function () {
                interaction.editReply({content: `The coin landed on **${result}**!`});
            }, 2000)
        }
    }
};
