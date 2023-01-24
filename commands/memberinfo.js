const Discord = require("discord.js");
const Models = require("../models/AllModels");

module.exports = {

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`memberinfo`)
    .setDescription(`Get information about a member of the server or yourself if left blank.`)
    .addUserOption(option => 
        option
        .setName(`member`)
        .setDescription(`The member to get infomation on.`)
        .setRequired(false)
        ),
    // Execute the command
    async execute(interaction) {
        // Get the staff channels
        const actionLog = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_log_channel_name")))); //mod log channel
        const modChannel = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("mod_channel_name")))); //mod channel
        const superChannel = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("super_channel_name")))); //super channel
        const adminChannel = interaction.guild.channels.cache.find((c => c.name.includes(interaction.client.settings.get("admin_channel_name")))); //admin channel
        // Get the mod+ roles
        const modTraineeRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("trainee_role_id"));
        const modRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("mod_role_id"));
        const superRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("super_role_id"));
        const adminRole = interaction.guild.roles.cache.find(role => role.id === interaction.client.settings.get("admin_role_id"));
        let warnings, mutes, kicks, bans, points, level, rank; // numeric vars
        const user = interaction.options.getUser(`member`) ?? interaction.user; //get the user or set to initiator 
        const member = interaction.guild.members.cache.get(user.id); //get the member instance of the user

        // If the user exists then call the userData function
        if (member) {
            userData(member);
        }

        async function userData(member) {
            const joinDate = member.joinedAt; // joined date
            const registerDate = member.user.createdAt; // register date
            const boostDate = member.premiumSince; // boost date
            let boostString = "Not Boosting";
            let bot;

            // set bot var based on user.bot boolean
            switch(member.user.bot) {
                case false:
                    bot = "I ain't no beep boop";
                    break;
                case true:
                    bot = "🤖 beep boop";
                    break;
            };

            // If user is boosting the server
            if(member.premiumSince) {
                boostString = `${Discord.time(boostDate, `D`)}`;
            }

            // Find all warnings from the user, if any
            await Models.warning.findAll({where:{user_id: member.user.id}, raw: true}).then((info) => {
                // If there are warnings then assign the amount to the warnings var
                if(info) {
                    warnings = info.length;
                }
            });

            // Find all mutes from the user, if any
            await Models.mute.findAll({where:{user_id: member.user.id}, raw: true}).then((info) => {
                // If there are warnings then assign the amount to the warnings var
                if(info) {
                    mutes = info.length;
                }
            });

            // Find all kicks from the user, if any
            await Models.kick.findAll({where:{user_id: member.user.id}, raw: true}).then((info) => {
                // If there are kicks then assign the amount to the kicks var
                if(info) {
                    kicks = info.length;
                }
            });

            // Find all bans from the user, if any
            await Models.ban.findAll({where:{user_id: member.user.id}, raw: true}).then((info) => {
                // If there are bans then assign the amount to the bans var
                if(info) {
                    bans = info.length;
                }
            });

            // Find all points and level from the user, if any
            await Models.user.findOne({where:{user_id: member.user.id}, raw: true}).then((info) => {
                // If the user has points then assign the points and level
                if(info) {
                    points = info.points;
                    level = info.level;

                // If not then set the points and level to N/A
                } else {
                    points = "N/A";
                    level = "N/A";
                }
            });

            // Find the user's ranking for points
            await Models.user.findAll({order:[['points', 'DESC']],raw:true}).then((info) => {
                if(info) {
                    // Look through the array of users and find the one with the correct ID
                    rank = info.map(function (e) {
                        return e.user_id;
                    }).indexOf(member.user.id);

                    // If the user isn't found assign the rank to be "N/A"
                    if(rank < 0) {
                        rank = "N/A"

                    // If the user was found, assign their rank
                    } else {
                        rank = `#${rank+1}`
                    }
                }
            })

            // Create the embed
            let userEmbed = new Discord.EmbedBuilder()
                .setColor(member.displayHexColor)
                .setDescription(`Information for ${member}`)
                .setAuthor({name: `${member.user.username}#${member.user.discriminator}`, iconURL: member.user.displayAvatarURL({dynamic:true})})
                .setThumbnail(member.user.displayAvatarURL({dynamic:true}))
                .addFields(
                    {
                        name: `Nickname`,
                        value: `${member.nickname || "None"}`,
                        inline: true
                    },
                    {
                        name: `Beep Boop`,
                        value: `${bot}`,
                        inline: true
                    },
                    {
                        name: `\u200B`,
                        value: `\u200B`,
                        inline: true
                    },
                    {
                        name: `Joined`,
                        value: `${Discord.time(joinDate, "D")}`,
                        inline: true
                    },
                    {
                        name: `Registered`,
                        value: `${Discord.time(registerDate, "D")}`,
                        inline: true
                    },
                    {
                        name: `Boosting`,
                        value: `${boostString}`,
                        inline: true
                    },
                    {
                        name: `Level`,
                        value: `${level}`,
                        inline: true
                    },
                    {
                        name: `Points`,
                        value: `${points}`,
                        inline: true
                    },
                    {
                        name: `Rank`,
                        value: `${rank}`,
                        inline: true
                    }


                )
                .setTimestamp()
                .setFooter({text: `User ID: ${member.user.id}`});

                // If the user is a mod or higher role and the requested user doesn't have any warnings
                if(interaction.member.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name)) && warnings > 0) {
                    userEmbed
                    .addFields({name: `Warnings`, value: `${warnings}`, inline: true})
                    .addFields({name: `Mutes`, value: `${mutes}`, inline: true})
                    .addFields({name: `\u200B`, value: `\u200B`, inline: true}) //add empty field for formatting
                    .addFields({name: `Kicks`, value: `${kicks}`, inline: true})
                    .addFields({name: `Bans`, value: `${bans}`, inline: true})
                    .addFields({name: `\u200B`, value: `\u200B`, inline: true}) //add empty field for formatting

                    // If the command was used in a public channel
                    if(interaction.channel !== modChannel && interaction.channel !== superChannel && interaction.channel !== adminChannel) {

                        // If the user didn't use the command in the action log channel
                        if(interaction.channel !== actionLog) {
                            // Send embed to the mod log channel
                            actionLog.send({embeds: [userEmbed]});

                            // Let the user know the info was sent
                            interaction.reply(`I've sent a message containing the data you requested to ${actionLog}.`);
                        } else if(interaction.channel === actionLog) {
                            // Send embed to the mod log channel
                            interaction.reply({embeds: [userEmbed]});
                        }

                    // If the command was used in a mod+ channel
                    } else {
                        // Send the message
                        interaction.reply({embeds: [userEmbed]})
                    }

                // If the user isn't a mod or higher
                } else {
                    // Send embed
                    interaction.reply({embeds: [userEmbed]});
                }
        }
    }
};
