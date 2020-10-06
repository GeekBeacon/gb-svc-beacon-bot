// Import required files
const ModerationController = require("../../controllers/ModerationController");

module.exports = {
    name: 'tempvoice',
    description: `Creates a temporary voice channel that will be deleted once all members leave.`,
    aliases: ['createtempvoice', 'ctv'],
    usage: "<name>, [member limit]",
    mod: true,
    super: false,
    admin: false,
    cooldown: 5,
    execute(message, args, client) {
        if (!args.length) {
            // If no arguments let users know arguments are required
            return message.reply(`uh oh! You must tell me what you'd like to name the new temporary voice channel!\nExample: \`${prefix}tempvoice Temporary Channel\``);
        } else {
            // Call the query handler from the Moderation Controller with required args
            ModerationController.tempVoiceHandler(message, args, client);
        }
    },
};
