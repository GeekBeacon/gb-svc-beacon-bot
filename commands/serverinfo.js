const Discord = require("discord.js");
const PermissionsController = require("../controllers/PermissionsController");

module.exports = {

    // Set config values
    name: 'serverinfo',
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    
    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`serverinfo`)
    .setDescription(`Gets information about the server!`),
    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);
        
        // If the command is disabled then let the user know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});
        // If the command isn't disabled, proceed
        } else {
            // If the member doesn't have the proper permissions for the command
            if(!approved) {
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

            // If the member has the proper permissions for the command
            } else {

                const server = interaction.guild;
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
                    let forumChannelCount = 0;
                    let serverURL;

                    // Loop through all the channels and increment the proper channel type's count
                    channels.forEach((channel) => {
                        switch(channel.type) {
                            case Discord.ChannelType.GuildCategory:
                                categoryCount++;
                                break;
                            case Discord.ChannelType.GuildAnnouncement:
                                newsChannelCount++;
                                break;
                            case Discord.ChannelType.GuildVoice:
                                voiceChannelCount++;
                                break;
                            case Discord.ChannelType.GuildText:
                                textChannelCount++;
                                break;
                            case Discord.ChannelType.PublicThread:
                                threadChannelCount++;
                                break;
                            case Discord.ChannelType.GuildForum:
                                forumChannelCount++;
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
                                value: `${Discord.time(createDate, "D")} (${Discord.time(createDate, "R")})`,
                                inline: true,
                            },
                            {
                                name: `Owner`,
                                value: `${await server.fetchOwner()}`,
                                inline: true,
                            },
                            {
                                name: `Boosts`,
                                value: `${server.premiumSubscriptionCount}`,
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
                                value: `Categories: ${categoryCount} | News: ${newsChannelCount} | Text: ${textChannelCount} \n Threads: ${threadChannelCount} | Forums: ${forumChannelCount} | Voice: ${voiceChannelCount}`,
                                inline: false,
                            },
                        ],
                            timestamp: new Date(),
                        footer: {
                            text: `Server ID: ${server.id}`,
                        }
                    };

                    interaction.reply({embeds: [serverEmbed]});
                }
            }
        }


        
    }
};
