// Import the required files
const DatabaseController = require("../../controllers/DatabaseController");

// Create a new module export
module.exports = {
    name: "disabletrigger",
    description: "Disabled a specific trigger word/phrase",
    aliases: ["dtrigger", "distrigger"],
    usage: "<trigger>",
    mod: false,
    super: true, // Minimum level required is Super (manage roles permission)
    admin: false,
    cooldown: 5,
    execute(message, args, client, triggerList) {
        // Check if any arguments were given, it not let user know
        if (!args.length) {
            message.channel.send("To disable a trigger you must enter the trigger that you'd like disable!");

        // If args were given...
        } else {

            // Call the query handler from the database controller with required args
            DatabaseController.queryHandler(message, args, client, triggerList);
        }
    }
}