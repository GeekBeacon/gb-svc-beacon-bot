// Import required files
const {db_name, db_host, db_port, db_user, db_pass} = require("../config.json");
const Sequelize = require('sequelize');

// Create a new module export
module.exports = {

    // Create a function to be called
    joinHandler: function(m) {
        const member = m; //assign the member var to the passed in member parameter
        const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false}); //create the sequelize connection
        const roles = []; //create the roles array

        // Query the database for all of the autoroles as a select
        sequelize.query("SELECT `role` FROM `autoroles`", {type:sequelize.QueryTypes.SELECT}).then(data => {

            // See if there are any autoroles in the db
            if (data) {
                // Find the role within the server and add it to the array
                data.forEach(item => {
                    roles.push(member.guild.roles.find(role => role.name === item.role));
                });

            // If no autoroles, just ignore assigning them
            } else {
                return;
            }
        
        }).then(() => {
            // Assign each role within the roles array to the user
            roles.forEach(role => {
                console.log("dix")
                member.addRole(role);
            });
        });
    }
}
