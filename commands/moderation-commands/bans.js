// Import required files
const ModerationController = require("../../controllers/ModerationController");

module.exports = {
    name: 'bans',
    description: 'Shows the 10 most recent bans',
    aliases: [`banlist`],
    usage: "[ban id]",
    cooldown: 5,
    enabled: true,
    mod: true,
    super: false,
    admin: false,
    execute(message, args, client) {
        ModerationController.listBans(message, args, client);
    },
};
