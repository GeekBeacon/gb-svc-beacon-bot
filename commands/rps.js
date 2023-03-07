// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");

module.exports = {

    // Set config values
    name: 'rps',
    enabled: true,
    mod: false,
    super: false,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`rps`)
    .setDescription(`Play a game of Rock, Paper, Scissors with me!`)
    .addStringOption(option => 
        option.setName(`choice`)
        .setDescription(`The choice you want to pick.`)
        .setRequired(true)
        .addChoices(
            {name: `Rock`, value: `rock`},
            {name: `Paper`, value: `paper`},
            {name: `Scissors`, value: `scissors`},
        )
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

            const choice = interaction.options.getString(`choice`); // member's choice
            const choices = [`rock`, `paper`, `scissors`]; // possible choices
            const result = choices[Math.floor(Math.random() * choices.length)]; // calculate bot's choice
            let results = ``; // string to announce results

            // If the member chose rock
            if(choice === `rock`) {
                // Determine the result based on the bot's choice
                if(result === `rock`) {
                    results = `rock. It's a tie!`;
                } else if(result === `paper`) {
                    results = `paper. I win!`;
                } else if(result === "scissors") {
                    results = `scissors. You win!`;
                }
            // If the member chose paper
            } else if(choice === `paper`) {
                // Determine the result based on the bot's choice
                if(result === `rock`) {
                    results = `rock. You win!`;
                } else if(result === `paper`) {
                    results = `paper. It's a tie!`;
                } else if(result === "scissors") {
                    results = `scissors. I win!`;
                }
            // If the member chose scissors
            } else if(choice === "scissors") {
                // Determine the result based on the bot's choice
                if(result === `rock`) {
                    results = `rock. I win!`;
                } else if(result === `paper`) {
                    results = `paper. You win!`;
                } else if(result === "scissors") {
                    results = `scissors. It's a tie!`;
                }
            }

            await interaction.reply({content: `Rock..Paper..Scissors..SHOOT!`, ephemeral: true, fetchReply: true});
            interaction.editReply({content: `I picked ${results}`});
        }
    }
};
