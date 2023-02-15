// Import required files
const ModerationController = require("../controllers/ModerationController");
const Discord = require(`discord.js`);

module.exports = {
    name: 'tempvoice',
    enabled: true,
    mod: false,
    super: false,
    admin: false,

    data: new Discord.SlashCommandBuilder()
        .setName(`tempvoice`)
        .setDescription(`Create a temp voice channel that will activate once a member joins then deleted once empty!`)
        .addStringOption(option => 
            option.setName(`name`)
            .setDescription(`The name of the channel`)
            .setMinLength(5)
            .setMaxLength(100)
            .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName(`limit`)
            .setDescription(`Optional member limit for the channel.`)
            .setMinValue(2)
            .setMaxValue(99)
            .setRequired(false)
        ),

    async execute(interaction) {
        
        // Call the query handler from the Moderation Controller with required args
        ModerationController.tempVoiceHandler(interaction);
    },
};
