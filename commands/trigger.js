// Import the required files
const Discord = require(`discord.js`);
const DatabaseController = require("../controllers/DatabaseController");

// Create a new module export
module.exports = {
    
    // Set config values
    name: `trigger`,
    enabled: true,
    // Set minimum staff level (available to ewverybody by default unless disabled)
    mod: true,
    super: false,
    admin: true,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`trigger`)
    .setDescription(`Configure the server's trigger list`)
    .addSubcommand(subcommand =>
        subcommand.setName(`list`)
            .setDescription(`Lists the currently enabled triggers.`)
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
    ),

    async execute(interaction) {
        //Do the stuff
    }
}