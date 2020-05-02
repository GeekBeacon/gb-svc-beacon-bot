const Discord = require("discord.js");
const {server_id, user_role} = require('../config');
const thumb = new Discord.MessageAttachment('./assets/verify-thumbnail.gif');

// Create a new module export
module.exports = {

    // Create a function with required args
    verifyCreator: function(m, a) {
        // Create vars
        const message = m, args = a;
        const verifyChannel = message.guild.channels.cache.find((c => c.name.includes("verify"))); //verify channel

        // Fetch the message from the verify channel
        verifyChannel.messages.fetch({limit:1}).then((messages) => {
            // If there is already a message in the channel don't create a new one
            if(messages.size !== 0) {
                return message.channel.send(`There is already a verify message!`);
            } else {
                // Make sure the arg is "create" and author is server owner
                if(args.length === 1 && args[0] === "create" && message.guild.ownerID === message.author.id) {
                    // Create the embed
                    const verifyEmbed = {
                        color: 0x886ce4,
                        title: `Welcome To GeekBeacon!`,
                        description: `Gamers, Techies, Coders Unite - GeekBeacon is the inclusive, friendly spot for you. Join our daily community events!`,
                        thumbnail: {
                            url: `attachment://verify-thumbnail.gif`,
                        },
                        fields: [
                            {
                                name: `**Resources**`,
                                value: `• Server Rules & Info - <#361832841677373452>\n • Channel Navigation - <#326648883037995009>\n• Introduce Yourself - <#330952061053304832>\n• Need Help? - <#363750021436276746>\n• [Discord How-To](https://support.discordapp.com/hc/en-us)\n• [Ask Nixie](https://forum.geekbeacon.org/c/ask-nixie)\n• [Suggestions](https://forum.geekbeacon.org/c/feedback)\n`,
                                inline: false,
                            },
                            {
                                name: `**Access Full Server!**`,
                                value: `**To view all the channels, you need to verify you are a human by simply clicking on the emoji below this message ( ✅ )**`,
                                inline: false,
                            }
                        ],
                        timestamp: `Last updated: ${new Date()}`,
                    }
                    // Send the embed along with the file for the thumbnail
                    verifyChannel.send({ files: [thumb], embed: verifyEmbed})
                    .then(sent => {
                        // React to the message with the proper emoji
                        sent.react(`✅`);
                    });
                }
            }
        })

    },
    verifyHandler: function(r, u) {
        // Create vars
        const user = u, reaction = r;
        const client = reaction.client;
        const guild = client.guilds.cache.find((g => g.id === server_id)); //guild
        const verifyChannel = guild.channels.cache.find((c => c.name.includes("verify"))); //verify channel
        const role = guild.roles.cache.find(r => r.name === user_role); //Users role

        // Fetch the message from the verify channel
        verifyChannel.messages.fetch({limit:1}).then(message => {

            // If the user is a bot or reacted to the wrong messag, ignore
            if(user.bot) {
                return;
            } else if(reaction.message.id !== message.first().id) {
                return;
            };
    
            // Get fetch the member with the proper user id
            guild.members.fetch(user.id).then((member) => {
                
                // Ensure the reaction is the right emoji
                if(reaction.emoji.name === `✅`) {
                    // Add the member to the role
                    member.roles.add(role);
                    // Remove the reaction
                    reaction.users.remove(member);
                } else {
                    // Remove the reaction 
                    reaction.remove();
                } 
            });
        });
    }
}