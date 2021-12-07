// Import required files
const Models = require("../models/AllModels");

// Create a new module export
module.exports = {

    reactionAdd: function(reaction, user, emojiRolePosts) {
        const thxRegex = /\b([A-Za-z]*?thx*|thanks|ty*|thank\s*you*)\b/; //regex to look for different forms of thanks
        const uid = reaction.message.author.id; //get the id of the message's author

        // Make sure the emoji is a "thx" emoji and a emoji within the guild
        if(reaction.emoji.name.toLowerCase().match(thxRegex) && reaction.emoji.guild.id === reaction.message.guildId) {

            // Make sure the message author and reaction giver aren't the same person and the message author isn't a bot
            if(reaction.message.author.id !== user.id && reaction.message.author.bot === false) {
                
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
                            let pointsVal = user.points + 3;
                            let level = 0;

                            // Determine the user's level
                            switch(pointsVal) {
                                case pointsVal >= 1000:
                                    level = 5;
                                    break;
                                case pointsVal >= 500:
                                    level = 4;
                                    break;
                                case pointsVal >= 100:
                                    level = 3;
                                    break;
                                case pointsVal >= 50:
                                    level = 2;
                                    break;
                                default:
                                    level = 1;
                                    break;
                            };

                            // Update the user's points and level
                            Models.user.update({points: pointsVal, level: level}, {where: {user_id: uid}});

                            // If the user isn't in the db
                        } else {
                            // Create a new user then and update the points and level
                            Models.user.create({
                                user_id: uid,
                                level: 1,
                                points: 3
                            });
                        }
                    })
                })
            }
        // If not a "thanks" emoji then check if it is an emojirole post
        } else if(emojiRolePosts._posts.includes(reaction.message.id)){

            if(user.bot === true) return; //if bot then ignore

            // If a new reaction was added
            if(reaction.count === 1) {
                reaction.remove(); //remove the new reaction
            // If the reaction exists
            } else {
                // Find the role in the db
                Models.emojirole.findOne({where:{emoji: reaction.emoji.toString()}, raw:true}).then(async (item) => {
                    // Ensure a role was found
                    if(item) {
                        const role = reaction.message.guild.roles.cache.get(item.role_id); //get the role
                        const member = await reaction.message.guild.members.fetch(user.id); //get the member version of the user
                        
                        if(!role || !member) {
                            return console.error(`There was a problem giving a user a role when they clicked the ${reaction.emoji.toString()} reaction on the following message: ${reaction.message.url}`); // If no role was found then trigger an error
                        
                        // If the role and member was found
                        } else {
                            // Give the role to the member
                            member.roles.add(role);
                        }
                    }
                })
            }
        }
    },

    reactionRemove: function(reaction, user, emojiRolePosts) {
        const thxRegex = /\b([A-Za-z]*?thx*|thanks|ty*|thank\s*you*)\b/; //regex to look for different forms of thanks
        const uid = reaction.message.author.id; //get the id of the message's author

        // Make sure the emoji is a "thx" emoji and a emoji within the guild
        if(reaction.emoji.name.toLowerCase().match(thxRegex) && reaction.emoji.guild.id === reaction.message.guildId) {

            // Make sure the message author and reaction giver aren't the same person and the message author isn't a bot
            if(reaction.message.author.id !== user.id && reaction.message.author.bot === false) {
                
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

                            // Remove points to the existing points value
                            let pointsVal = user.points - 3;
                            let level = 0;

                            // Determine the user's level
                            switch(pointsVal) {
                                case pointsVal >= 1000:
                                    level = 5;
                                    break;
                                case pointsVal >= 500:
                                    level = 4;
                                    break;
                                case pointsVal >= 100:
                                    level = 3;
                                    break;
                                case pointsVal >= 50:
                                    level = 2;
                                    break;
                                default:
                                    level = 1;
                                    break;
                            };

                            // Update the user's points and level
                            Models.user.update({points: pointsVal, level: level}, {where: {user_id: uid}});
                        }
                    })
                })
            }
            
        // If not a "thanks" emoji then check if it is an emojirole post
        } else if(emojiRolePosts._posts.includes(reaction.message.id)){

            if(user.bot === true) return; //if bot then ignore

            // Find the role in the db
            Models.emojirole.findOne({where:{emoji: reaction.emoji.toString()}, raw:true}).then(async (item) => {
                // Ensure a role was found
                if(item) {
                    const role = reaction.message.guild.roles.cache.get(item.role_id); //get the role
                    const member = await reaction.message.guild.members.fetch(user.id); //get the member version of the user
                    
                    if(!role || !member) {
                        return console.error(`There was a problem removing a user a role when they clicked the ${reaction.emoji.toString()} reaction on the following message: ${reaction.message.url}`); // If no role was found then trigger an error
                    
                    // If the role and member was found
                    } else {
                        // Give the role to the member
                        member.roles.remove(role);
                    }
                }
            })
        }
    }
}