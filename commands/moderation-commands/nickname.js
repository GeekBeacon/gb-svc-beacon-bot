// Import required files
const ModerationController = require("../../controllers/ModerationController");

module.exports = {
    name: 'nick',
    description: "Changes a users' nickname",
    aliases: ['nickname', 'name'],
    usage: "<user>, <nickname>",
    mod: true,
    super: false,
    admin: false,
    cooldown: 5,
    execute(message, args, client) {
        if (!args.length) {
            // If no arguments let users know arguments are required
            return message.reply(`you must tell me the user you wish to change the nickname for!`);
        } else if  (args.length === 1) {
            // If only one arg was provided let the user know to provide the new nickname
            return message.reply(`you must tell me the new nickname to apply to the user!`)
        } else {
            // Call the query handler from the database controller with required args
            ModerationController.nicknameHandler(message, args, client);
        }
    },
};
