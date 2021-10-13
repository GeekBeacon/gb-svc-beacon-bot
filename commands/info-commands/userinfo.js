const Discord = require("discord.js");
const Models = require("../../models/AllModels");

module.exports = {
    name: 'userinfo',
    description: 'Get information about a member of the server.',
    aliases: ['whois'],
    cooldown: 5,
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    usage: "<mention | id>",
    async execute(message, args, client) {
        const prefix = client.settings.get("prefix");
        const actionLog = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_log_channel_name")))); //mod log channel
        const modChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("mod_channel_name")))); //mod channel
        const superChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("super_channel_name")))); //super channel
        const adminChannel = message.guild.channels.cache.find((c => c.name.includes(client.settings.get("admin_channel_name")))); //admin channel
        let user; // user var
        // Get the mod+ roles
        const modTraineeRole = message.guild.roles.cache.find(role => role.id === client.settings.get("trainee_role_id"));
        const modRole = message.guild.roles.cache.find(role => role.id === client.settings.get("mod_role_id"));
        const superRole = message.guild.roles.cache.find(role => role.id === client.settings.get("super_role_id"));
        const adminRole = message.guild.roles.cache.find(role => role.id === client.settings.get("admin_role_id"));
        let warnings, mutes, kicks, bans, points, level, rank = 0; // numeric vars

        // Make sure user provived an argument
        if(!args.length) {
            user = message.guild.members.cache.get(message.author.id); //get the author's guild member object
            // If no argument was provided give the author's info by calling the userData function
            userData(user);
        } else {
            // If the user provided a user mention
            if(args[0].startsWith("<@")) {
                user = message.mentions.members.first(); //assign the user mention
            // If user provided a number
            } else if(!isNaN(args[0])) {
                // If invalid id let the user know
                if(message.guild.members.cache.get(args[0]) === undefined) {
                    return message.reply(`Uh oh! Looks like I wasn't able to find that user, please check the user id and try again or try using a user mention like so: \`${prefix}whois @Username\``);

                // If user found, assign it to the user var
                } else {
                    user = message.guild.members.cache.get(args[0]); //assign the user mention
                }
            // If user didn't provide a user id or mention
            } else {
                return message.reply(`It seems you didn't provide either a user mention or id, please try again!`)
            }

            // If the user exists
            if(user) {
                // Call the userData function
                userData(user);
            }
        }

        async function userData(u) {
            const joinDate = u.joinedAt; // joined date
            const registerDate = u.user.createdAt; // register date
            const boostDate = u.premiumSince; // boost date
            let boostString = "Not Boosting";
            let bot;

            // set bot var based on user.bot boolean
            switch(u.user.bot) {
                case false:
                    bot = "I ain't no beep boop";
                    break;
                case true:
                    bot = "🤖 beep boop";
                    break;
            };

            // If user is boosting the server
            if(u.premiumSince) {
                boostString = `${Discord.Formatters.time(boostDate, "D")}`;
            }

            // Find all warnings from the user, if any
            await Models.warning.findAll({where:{user_id: u.user.id}, raw: true}).then((info) => {
                // If there are warnings then assign the amount to the warnings var
                if(info) {
                    warnings = info.length;
                }
            });

            // Find all mutes from the user, if any
            await Models.mute.findAll({where:{user_id: u.user.id}, raw: true}).then((info) => {
                // If there are warnings then assign the amount to the warnings var
                if(info) {
                    mutes = info.length;
                }
            });

            // Find all kicks from the user, if any
            await Models.kick.findAll({where:{user_id: u.user.id}, raw: true}).then((info) => {
                // If there are kicks then assign the amount to the kicks var
                if(info) {
                    kicks = info.length;
                }
            });

            // Find all bans from the user, if any
            await Models.ban.findAll({where:{user_id: u.user.id}, raw: true}).then((info) => {
                // If there are bans then assign the amount to the bans var
                if(info) {
                    bans = info.length;
                }
            });

            // Find all points and level from the user, if any
            await Models.user.findOne({where:{user_id: u.user.id}, raw: true}).then((info) => {
                // If there are points then assign the amount to the bans var
                if(info) {
                    points = info.points;
                    level = info.level;
                }
            });

            // Find the user's ranking for points
            await Models.user.findAll({order:[['points', 'DESC']],raw:true}).then((info) => {
                if(info) {
                    // Look through the array of users and find the one with the correct ID
                    rank = info.map(function (e) {
                        return e.user_id;
                    }).indexOf(u.user.id);
                }
            })

            // Create the embed
            let userEmbed = new Discord.MessageEmbed()
                .setColor(u.displayHexColor)
                .setDescription(`Information for ${u}`)
                .setAuthor(`${u.user.username}#${u.user.discriminator}`, u.user.displayAvatarURL({dynamic:true}))
                .setThumbnail(u.user.displayAvatarURL({dynamic:true}))
                .addFields(
                    {
                        name: `Nickname`,
                        value: `${u.nickname || "None"}`,
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
                        value: `${Discord.Formatters.time(joinDate, "D")}`,
                        inline: true
                    },
                    {
                        name: `Registered`,
                        value: `${Discord.Formatters.time(registerDate, "D")}`,
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
                        value: `#${rank +1}`,
                        inline: true
                    }


                )
                .setTimestamp()
                .setFooter(`User ID: ${u.user.id}`);

                // If the user is a mod or higher role and the requested user doesn't have any warnings
                if(message.member.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name)) && warnings > 0) {
                    userEmbed
                    .addField(`Warnings`, `${warnings}`, true)
                    .addField(`Mutes`, `${mutes}`, true)
                    .addField(`\u200B`, `\u200B`, true) //add empty field for formatting
                    .addField(`Kicks`, `${kicks}`, true)
                    .addField(`Bans`, `${bans}`, true)
                    .addField(`\u200B`, `\u200B`, true); //add empty field for formatting

                    // If the command was used in a public channel
                    if(message.channel !== modChannel && message.channel !== superChannel && message.channel !== adminChannel) {
                        // Send embed to the mod log channel
                        actionLog.send({embeds: [userEmbed]});

                        // If the user didn't use the command in the action log channel
                        if(message.channel !== actionLog) {
                            // Let the user know the info was sent
                            message.channel.send(`I've sent a message containing the data you requested to ${actionLog}.`);
                        }

                    // If the command was used in a mod+ channel
                    } else {
                        // Send the message
                        message.channel.send({embeds: [userEmbed]})
                    }

                // If the user isn't a mod or higher
                } else {
                    // Send embed
                    message.channel.send({embeds: [userEmbed]});
                }
        }
    },
};
