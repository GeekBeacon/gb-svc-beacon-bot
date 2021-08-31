const moment = require("moment");
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
        let warnings, kicks, bans = 0; // numeric vars

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
            const joinDate = moment(u.joinedAt).format("MMM DD, YYYY"); // joined date
            const joinTime = moment(u.joinedAt).format("h:mm A"); // joined time
            const registerDate = moment(u.user.createdAt).format("MMM DD, YYYY"); // register date
            const registerTime = moment(u.user.createdAt).format("h:mm A"); // register time
            const boostDate = moment(u.premiumSince).format("MMM DD, YYYY"); // boost date
            const boostTime = moment(u.premiumSince).format("h:mm A"); // boost time
            let boostString = "No";
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
                boostString = `${boostDate}\n${boostTime}`;
            }

            // Find all warnings from the user, if any
            await Models.warning.findAll({where:{user_id: u.user.id}, raw: true}).then((info) => {
                // If there are warnings then assign the amount to the warnings var
                if(info) {
                    warnings = info.length;
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

            // Create the embed
            let userEmbed = new Discord.MessageEmbed()
                .setColor(u.displayHexColor)
                .setDescription(`Information for ${u}`)
                .setAuthor(`${u.user.username}#${u.user.discriminator}`, u.user.displayAvatarURL({dynamic:true}))
                .setThumbnail(u.user.displayAvatarURL({dynamic:true}))
                .addFields(
                    {
                        name: `Joined`,
                        value: `${joinDate}\n${joinTime}`,
                        inline: true
                    },
                    {
                        name: `Registered`,
                        value: `${registerDate}\n${registerTime}`,
                        inline: true
                    },
                    {
                        name: `Boosting`,
                        value: `${boostString}`,
                        inline: true
                    },
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


                )
                .setTimestamp()
                .setFooter(`User ID: ${u.user.id}`);

                // If the user is a mod or higher role and the requested user doesn't have any warnings
                if(message.member.roles.cache.some(r => [modTraineeRole.name, modRole.name, superRole.name, adminRole.name].includes(r.name)) && warnings > 0) {
                    userEmbed
                    .addField(`\u200b`, `\u200b`, true) // Add an empty field for formatting purposes
                    .addField(`Warnings`, `${warnings}`, true)
                    .addField(`Kicks`, `${kicks}`, true)
                    .addField(`Bans`, `${bans}`, true);

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
