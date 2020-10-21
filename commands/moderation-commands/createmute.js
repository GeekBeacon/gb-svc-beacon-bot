// Import required files
const DatabaseController = require("../../controllers/DatabaseController");

module.exports = {
    name: 'createmute',
    description: `Creates any missing muted roles and automatically moves it to the right position and sets channel permissions for all channels for the role(s).`,
    aliases: ['createsilence'],
    usage: " ",
    cooldown: 5,
    enabled: true,
    mod: false,
    super: false,
    admin: true,
    execute(message, args, client) {
        // Call the query handler from the database controller with required args
        DatabaseController.queryHandler(message, args, client);
    },
};
