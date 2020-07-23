// Import required files
const ModerationController = require("../../controllers/ModerationController");

module.exports = {
    name: 'bans',
    description: 'Shows the 10 most recent bans',
    aliases: [`banlist`],
    usage: "[ban id]",
    mod: true,
    super: false,
    admin: false,
    cooldown: 5,
    execute(message, args, client) {
        ModerationController.listBans(message, args, client);
    },
};
