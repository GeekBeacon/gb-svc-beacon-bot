// Import the required files
const DatabaseController = require("../../controllers/DatabaseController");

// Create a new module export
module.exports = {
    name: "enabletrigger",
    description: "Enables a specific trigger word/phrase",
    aliases: ["etrigger", "entrigger"],
    usage: "<trigger>",
    cooldown: 5,
    enabled: true,
    mod: false,
    super: true, // Minimum level required is Super (manage roles permission)
    admin: false,
    execute(message, args, client, triggerList) {
        // Check if any arguments were given, it not let user know
        if (!args.length) {
            message.channel.send("To enable a trigger you must enter the trigger that you'd like enable!");

        // If args were given...
        } else {

            // Call the query handler from the database controller with required args
            DatabaseController.queryHandler(message, args, client, triggerList);
        }
    }
}