// Import required files
const Models = require("../models/AllModels");
const Discord = require(`discord.js`);

// Create a new module export
module.exports = {

    // Create the method to handle invite creates
    inviteCreate: async function(invite, client) {
        const adminChannel = invite.guild.channels.cache.find((c => c.name.includes(client.settings.get("admin_channel_name")))); //admin channel

        // If the invite code is using the vanity url, then ignore it
        if(invite.code === invite.guild.vanityURLCode) {
            return;
        } else {
            invite.delete(`Auto deleted invite, please use vanity url or discord.geekbeacon.org!`).then(() => {
                if(invite.guild.vanityURLCode) {
                    adminChannel.send(`${invite.inviter}, I have deleted your recently created invite. Please use https://discord.gg/${invite.guild.vanityURLCode} or https://discord.geekbeacon.org to invite people to the server! \n\nIf this was created from an event, either copy the event link or copy the event id and append \`?event={event id}\` to the vanity url.`);
                } else {
                    adminChannel.send(`${invite.inviter}, I have deleted your recently created invite. Please use https://discord.geekbeacon.org to invite people to the server!`);
                }
            })
        }

    }
}