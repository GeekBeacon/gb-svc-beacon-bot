// Import required files
const Models = require("../models/AllModels");
const Discord = require(`discord.js`);

// Create a new module export
module.exports = {

    givePoints: function(message, client) {
        const thxRegex = /\b(thanks*|thx*|ty*|thank\s*you*)\b/

        console.log("test")


        // Check if the message was a reply
        if(message.type === Discord.MessageType.Reply) {

            // Make sure the post is from the same guild (not an automated message when following channels in other servers)
            if(message.reference.guildId === message.guildId) {
                // Get the data about the reference
                message.fetchReference().then((reference) => {
                    // Ensure the message isn't a system message about a message being pinned
                    if(reference.pinned === false) {
                        if(message.author.id !== reference.author.id) {
                            // Check if the user said thanks within their reply
                            if(message.content.toLowerCase().match(thxRegex)) {

                                // Call the addToDB function to update or create the user with 3 point value
                                addToDB(reference.author.id, 3);
                            }
                        }
                    }
                })
            }
        } else {

            // Ignore thread creation to avoid giving an extra point since it also counts the thread starter message
            if(message.type === Discord.MessageType.ThreadCreated) return;


            // Call the addToDB function to update or create the user with 1 point value
            addToDB(message.author.id, 1);
        }

        function addToDB(uid, pval) {



            /* 
            * Sync the model to the table
            * Creates a new table if table doesn't exist, otherwise just inserts a new row
            * id, createdAt, and updatedAt are set by default; DO NOT ADD
            !!!!
                Keep force set to false otherwise it will overwrite the table instead of making a new row!
            !!!!
            */
            Models.user.sync({force: false}).then(() => {
                // Check if the user is in the db already
                Models.user.findOne({where: {user_id: uid}, raw: true}).then((user) => {

                    // If the user is in the db
                    if(user) {

                        // Add points to the existing points value
                        let pointsVal = user.points + pval;

                        // Get the user's new level
                        let newLevel =
                            pointsVal >= 1000 ? 5 :
                            pointsVal >= 500 ? 4 :
                            pointsVal >= 100 ? 3 :
                            pointsVal >= 50 ? 2 : 1;

                        // If the user's level has went up
                        if(newLevel > user.level) {
                            const newRole = message.guild.roles.resolve(client.settings.get(`level_${newLevel}_role_id`)); //find the new role
                            const member = message.guild.members.cache.get(user.user_id); //find the member

                            // Assign the new role to the user
                            member.roles.add(newRole, `${member.displayName} has leveled up!`);

                            // If the member leveled higher than 1
                            if(newLevel !== 1) {
                                const oldRole = message.guild.roles.resolve(client.settings.get(`level_${newLevel-1}_role_id`)); //find the old role
                                // Remove the previous role
                                member.roles.remove(oldRole, `${member.displayName} has leveled up!`)
                            }
                        }

                        // Update the user's points and level
                        Models.user.update({points: pointsVal, level: newLevel}, {where: {user_id: uid}});

                        // If the user isn't in the db
                    } else {

                        const newRole = message.guild.roles.resolve(client.settings.get(`level_1_role_id`)); //find the new role
                        const member = message.guild.members.cache.get(uid); //find the member

                        // Assign the new role to the user
                        member.roles.add(newRole, `${member.displayName} has leveled up!`);


                        // Create a new user then and update the points and level
                        Models.user.create({
                            user_id: uid,
                            level: 1,
                            points: pval
                        });
                    }
                })
            })
        }
    }
};