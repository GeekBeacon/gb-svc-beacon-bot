// Import required files
const Models = require("../models/AllModels");

// Create a new module export
module.exports = {

    givePoints: function(message) {
        const thxRegex = /\b(thanks*|thx*|ty*|thank\s*you*)\b/
        // Check if the message was a reply
        if(message.reference) {
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
                            points: pval
                        });
                    }
                })
            })
        }
    }
};