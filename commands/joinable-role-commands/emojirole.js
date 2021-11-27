// Import the required files
const EmojiRoleController = require("../../controllers/EmojiRoleController");

module.exports = {
    name: 'emojirole',
    description: 'Create the initial post for emoji roles or add/remove a role to the existing emoji roles post.',
    aliases: ['reactionrole', `reactrole`],
    cooldown: 5,
    enabled: true,
    mod: false,
    super: false,
    admin: true,
    usage: "<add | remove>",
    execute(message, args, client) { 
        const subcommands = ['create', 'add', 'remove']; //list of accepted subcommands
        const prefix = client.settings.get("prefix");
        
        // If the user provided a valid subcommand call the emojiRoleHandler function from the EmojiRoleController
        if(subcommands.includes(args[0].toLowerCase())) {
            EmojiRoleController.emojiRoleHandler(message, args, client)
        // If the user didn't provide a valid subcommand let them know
        } else {
            return message.reply(`Uh oh! It seems that you provided me with an invalid subcommand!\nPlease use \`\`${prefix}help emojirole\`\` to view accepted subcommands!`)
        }
    }
}