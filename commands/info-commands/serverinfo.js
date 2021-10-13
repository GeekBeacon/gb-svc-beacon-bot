const Discord = require("discord.js");

module.exports = {
    name: 'serverinfo',
    description: 'Get information about the server.',
    aliases: ['serverstats'],
    cooldown: 5,
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    usage: " ",
    async execute(message, args, client) {
        const server = message.guild;
        // Make sure the server is available
        if(server.available) {
            const createDate = server.createdAt; // created date
            const channels = server.channels.cache;
            const roles = server.roles.cache;
            let roleCount = 0;
            let categoryCount = 0;
            let newsChannelCount = 0;
            let textChannelCount = 0;
            let voiceChannelCount = 0;
            let threadChannelCount = 0;
            let serverURL;

            channels.forEach((channel) => {
                switch(channel.type) {
                    case "GUILD_CATEGORY":
                        categoryCount++;
                        break;
                    case "GUILD_NEWS":
                        newsChannelCount++;
                        break;
                    case "GUILD_VOICE":
                        voiceChannelCount++;
                        break;
                    case "GUILD_TEXT":
                        textChannelCount++;
                        break;
                    case "GUILD_PUBLIC_THREAD":
                        threadChannelCount++;
                        break;
                    default:
                        break;
                };
            });

            // Get the role count
            roles.forEach(() => {
                roleCount++;
            })

            // If server has no vanity url then assign N/A
            if(server.vanityURLCode === null) {
                serverURL = `N/A`;
            // If server has vanity url then build invite link
            } else {
                serverURL = `https://discord.gg/${server.vanityURLCode}`;
            }

            // Create the embed
            const serverEmbed = {
                color: 0x33ccff,
                author: {
                    name: `${server.name}`,
                    icon_url: server.iconURL(),
                },
                title: `${server.name} Information`,
                description: `${server.description || "Not Set"}`,
                thumbnail: {
                    url: `${server.iconURL()}`,
                },
                fields: [
                    {
                        name: `Members`,
                        value: `${server.memberCount}`,
                        inline: true,
                    },
                    {
                        name: `Created`,
                        value: `${Discord.Formatters.time(createDate, "D")} (${Discord.Formatters.time(createDate, "R")})`,
                        inline: true,
                    },
                    {
                        name: `Owner`,
                        value: `${await server.fetchOwner()}`,
                        inline: true,
                    },
                    {
                        name: `Boosts`,
                        value: `${server.premiumSubscriptionCount}/30`,
                        inline: true,
                    },
                    {
                        name: `Level`,
                        value: `${server.premiumTier}`,
                        inline: true,
                    },
                    {
                        name: `Status`,
                        value: `Verified: ${server.verified}\nPartnered: ${server.partnered}`,
                        inline: true,
                    },
                    {
                        name: `Roles`,
                        value: `${roleCount}`,
                        inline: true,
                    },
                    {
                        name: `Server Ping`,
                        value: `${server.shard.ping}`,
                        inline: true,
                    },
                    {
                        name: `Rules Channel`,
                        value: `${server.rulesChannel || "Not Set"}`,
                        inline: true,
                    },
                    {
                        name: `Vanity URL`,
                        value: `${serverURL}`,
                        inline: true,
                    },
                    {
                        name: `Channels`,
                        value: `Categories: ${categoryCount} | News: ${newsChannelCount} | Text: ${textChannelCount} | Threads: ${threadChannelCount} | Voice: ${voiceChannelCount}`,
                        inline: false,
                    },
                ],
                    timestamp: new Date(),
                footer: {
                    text: `Server ID: ${server.id}`,
                }
            };

            message.channel.send({embeds: [serverEmbed]});
        }
    },
};
