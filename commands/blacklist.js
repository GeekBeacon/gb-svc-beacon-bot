// Import the required files
const ModerationController = require("../controllers/ModerationController");
const Discord = require(`discord.js`);

// Create a new module export
module.exports = {
    name: "blacklist",
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`blacklist`)
        .setDescription(`Add, remove, or list banned domains!`)
        .addSubcommand(subcommand => 
            subcommand.setName(`add`)
            .setDescription(`Add a domain to the blacklist.`)
            .addStringOption(option => 
                option.setName(`domain`)
                .setDescription(`The domain you want to blacklist.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`remove`)
            .setDescription(`Remove a domain to the blacklist.`)
            .addStringOption(option => 
                option.setName(`domain`)
                .setDescription(`The domain you want to remove.`)
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => 
            subcommand.setName(`list`)
            .setDescription(`List the domains in the blacklist.`)
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Call the blacklist handler function from the ModerationController file
        //ModerationController.blacklistHandler(interaction);
    }
}