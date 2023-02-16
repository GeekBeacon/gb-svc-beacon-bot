// Import required files
const DatabaseController = require("../controllers/DatabaseController");
const Discord = require(`discord.js`);

module.exports = {
    name: 'timeout',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`timeout`)
        .setDescription(`Prevents a member from using voice, text, and reactions!`)
        .addSubcommand(subcommand => 
            subcommand.setName(`add`)
            .setDescription(`Put a member in timeout.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you want to put in timeout.`)
                .setRequired(true)
            )
            .addIntegerOption(option => 
                option.setName(`duration`)
                .setDescription(`How many minutes you want to keep the member in timeout.`)
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)
            )
            .addStringOption(option => 
                option.setName(`reason`)
                .setDescription(`The reason you are putting the member into timeout.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`remove`)
            .setDescription(`Remove a member from timeout.`)
            .addUserOption(option => 
                option.setName(`user`)
                .setDescription(`The member you want to remove from timeout.`)
                .setRequired(true)
            )
            .addStringOption(option => 
                option.setName(`reason`)
                .setDescription(`The reason you are removing the member from timeout.`)
                .setRequired(true)
            )
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        // Call the query handler from the database controller
        DatabaseController.queryHandler(interaction);
    },
};
