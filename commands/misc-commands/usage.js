const {prefix} = require('../../config');
let desc = "Get a link to the usage guide for the bot";

module.exports = {
    name: 'usage',
    description: desc,
    aliases: ['docs'],
    cooldown: 5,
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    usage: " ",
    execute(message, args) {

        if(args.length) {
            desc = args[0];
        }

        // Create the embed
        const linkEmbed = {
            color: 0x33ccff,
            title: `Bot Usage Guide`,
            url: `https://github.com/OSAlt/gb-svc-beacon-bot/blob/master/docs/USER-GUIDE.md`,
            description: `The above link provided will direct you to the bot usage guide which will explain each and every command the bot currently has!\n\nYou can use \`${prefix}help\` to get a list of commands or \`${prefix}help [command]\` to get info on a specific command!`,
            timestamp: new Date()
        }

        // Send the embed
        message.channel.send({embed: linkEmbed});
    },
};
