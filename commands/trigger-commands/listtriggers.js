// Import the required files
const DatabaseController = require("../../controllers/DatabaseController");

// Create a new module export
module.exports = {
    name: "listtriggers",
    description: "Lists all of the triggers",
    aliases: ["triggers", "showtriggers", "alltriggers", "viewtriggers"],
    usage: "[trigger]",
    cooldown: 5,
    enabled: true,
    mod: true,  // Minimum level required is Mod (kick members permission)
    super: false,
    admin: false,
    execute(message, args, client) {
        // Call the query handler from the database controller
        DatabaseController.queryHandler(message, args, client);
    }
}