// Import required files
const Discord = require("discord.js");
const TriggersController = require("./TriggersController");
const ModerationController = require("./ModerationController");
const PointsController = require("./PointsController");

// Create a new module export
module.exports = {

    // Create a function to be called
    messageHandler: async function(m, c, ds) {
        // Create vars
        const message = m, client = c, deleteSet = ds;
        let inModTraineeRole, inModRole, inSuperRole, inAdminRole, isOwner;
        let triggerArr = [];
        let bannedUrlArr = [];
        const mod_trainee_role = client.settings.get("trainee_role_id"); //assign the trainee role
        const mod_role = client.settings.get("mod_role_id"); //assign the mod role
        const super_role = client.settings.get("super_role_id"); //assign the super role
        const admin_role = client.settings.get("admin_role_id"); //assign the admin role
        const excluded_trigger_channels = client.settings.get("excluded_channels").split(",");
        const url_role_whitelist = client.settings.get("url_role_whitelist").split(",");

        // Add each trigger word/phrase to the trigger array
        client.triggers.forEach((value, key) => {
            triggerArr.push(key);
        });

        // Loop through the bannedUrl list
        client.blacklist.forEach((value, key) => {
            // Add each domain to the bannedUrlArr var
            bannedUrlArr.push(value);
        });

        // Make sure the author isn't a bot and message is from a text channel before checking its' roles
        if(!message.author.bot && (message.channel.type === "GUILD_TEXT" || message.channel.type === "GUILD_NEWS_THREAD" || message.channel.type === "GUILD_PUBLIC_THREAD" || message.channel.type === "GUILD_PRIVATE_THREAD")) {
            inModTraineeRole = message.member.roles.cache.some(role => role.id === mod_trainee_role);
            inModRole = message.member.roles.cache.some(role => role.id === mod_role);
            inSuperRole = message.member.roles.cache.some(role => role.id === super_role);
            inAdminRole = message.member.roles.cache.some(role => role.id === admin_role);
            isOwner = message.member.guild.owner;

        // If not a bot and not in a text channel
        } else if(!message.author.bot && message.channel.type === "DM") {
            return message.channel.send(`Oh hello, ${message.author.username}!\n\nIt seems you tried to message me within a dm, I appreciate you sliding up into my dms, but at this time I do not support any dm-based commands!`);
        }

        

        // If the message is from a bot, ignore it
        if (message.author.bot) {
            return;

        // Check if the message contains a url
        } else if (message.content.toLowerCase().match(/(?!w{1,}\.)(\w+\.?)([a-zA-Z0-9-]+)(\.\w+)/)) {
            // If user has an excluded role then ignore
            if(message.member.roles.cache.some(r => url_role_whitelist.includes(r.id))) {
                return;
            }

            // If not blacklisted then ignore
            if(!message.content.toLowerCase().match(bannedUrlArr.map(domain => `\\b${domain}\\b`).join("|"))) {
                return;
                
            // If blacklisted url then handle it
            } else {
                const regexMatch = message.content.toLowerCase().match(/(?!w{1,}\.)(\w+\.?)([a-zA-Z0-9-]+)(\.\w+)/);
                // Call the handleUrl function from the ModerationController file
                ModerationController.handleUrl(message, client, regexMatch, deleteSet);
            };

        // Check if the message contains a trigger in the list
        /* More specifically it: 
        1. checks the triggerList to see if there is a trigger word
        2. parses the trigger with regex to ensure it is an exact match
        */
        } else if (triggerArr.some(trigger => message.content.toLowerCase().match(`\\b${trigger}\\b`))) {

            // Check if the channel the message was sent from is in the excluded channels array
            const channelExcluded = excluded_trigger_channels.some(name => message.channel.name.includes(name));
            
            // If within an excluded channel then ignore
            if(channelExcluded) {
                return;
            } 
            // Store the trigger words
            const triggers = triggerArr.filter((trig) => message.content.toLowerCase().match(`\\b(${trig})\\b`));

            // Call the triggerHit function from the TriggersController file
            TriggersController.triggerHit(message, triggers, client);
        // If not a trigger word/phrase, a blacklisted domain, or a bot message then call the experience controller to give experience.
        } else {
            PointsController.givePoints(message, client);
        }
    }
}
