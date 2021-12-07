// Import required files
const DatabaseController = require("../../controllers/DatabaseController");

module.exports = {
    name: 'ban',
    description: 'Ban a user from the server, with optional argument allowing for the number of days to clear messages from the user (0-7); default being not to clear messages.',
    aliases: [],
    usage: "<@user | user id>, <reason>, <time>, [Message Delete]",
    cooldown: 5,
    enabled: true,
    mod: true,
    super: false,
    admin: false,
    execute(message, args, client) {
        const prefix = client.settings.get("prefix");
        if (!args.length) {
            // If no arguments let users know arguments are required
            return message.reply(`You must mention the user or add the user's id that you wish to ban, a reason, and a time!\n\nExamples: \`${prefix}ban @username, gore, permanently\` \`${prefix}kick 1234567890, flaming users, 3 weeks, 7\``);
        } else {
            // Call the query handler from the database controller with required args
            DatabaseController.queryHandler(message, args, client);
        }
    },
};
