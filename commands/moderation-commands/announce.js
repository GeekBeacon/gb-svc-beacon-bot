// Import required files
const DatabaseController = require("../../controllers/DatabaseController");

module.exports = {
    name: 'announce',
    description: `Create, edit, remove, or view any announcement(s)\n\n**Notes:**\n• This supports up to 10 emoji reactions for polls\n• To add clickable links use this format: \`\`[Text](URL, 'Optional Hover Text')\`\` Example: \`\`[GeekBeacon](https://geekbeacon.org/, 'GeekBeacon Website')\`\``,
    aliases: ['announcement'],
    cooldown: 5,
    enabled: true,
    mod: false,
    super: true,
    admin: false,
    usage: "[create | edit | remove | view] [id | mention | user id | recent]",
    execute(message, args, client) {
        const prefix = client.settings.get("prefix");

        if (!args.length) {
            // If no arguments let users know arguments are required
            return message.reply(`You must tell me what you want to do with this command; Create, edit, remove, or view\n\nExamples:\n• \`\`${prefix}announce create\`\`\n• \`\`!${prefix}announce view @${message.author}\`\`\n• \`\`!${prefix}announce edit 3\`\``);
        } else {
            // Call the query handler from the database controller with required args
            DatabaseController.queryHandler(message, args, client);
        }
    },
};
