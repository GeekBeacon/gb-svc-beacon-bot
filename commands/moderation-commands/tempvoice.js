// Import required files
const ModerationController = require("../../controllers/ModerationController");

module.exports = {
    name: 'tempvoice',
    description: `Creates a temporary voice channel that will be activated once a member joins and then deleted once all members leave. Optionally you can set a user limit ranging from 1 to 99.`,
    aliases: ['createtempvoice', 'ctv'],
    usage: "<name>, [user limit]",
    cooldown: 5,
    enabled: true,
    mod: true,
    super: false,
    admin: false,
    execute(message, args, client) {
        if (!args.length) {
            // If no arguments let users know arguments are required
            return message.reply(`Uh oh! You must tell me what you'd like to name the new temporary voice channel!\nExample: \`${prefix}tempvoice Temporary Channel\``);
        } else {
            // Call the query handler from the Moderation Controller with required args
            ModerationController.tempVoiceHandler(message, args, client);
        }
    },
};
