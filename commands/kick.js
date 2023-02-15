// Import required files
const DatabaseController = require("../controllers/DatabaseController");
const Discord = require(`discord.js`);

module.exports = {
    name: 'kick',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`kick`)
        .setDescription(`Kick a member from the server!`)
        .addUserOption(option => 
            option.setName(`user`)
            .setDescription(`The member you want to kick.`)
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName(`reason`)
            .setDescription(`The reason you want to kick the member.`)
            .setRequired(true)
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Call the query handler from the database controller with required args
        DatabaseController.queryHandler(interaction);
    },
};
