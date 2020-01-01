// Import the required files
const Sequelize = require('sequelize');
const {prefix, db_name, db_host, db_port, db_user, db_pass} = require("../config.json");
const TriggersController = require("./TriggersController");
const AutorolesController = require("./AutorolesController");
const JoinableRolesController = require("./JoinableRolesController");
const WarningsController = require("./WarningsController");

// Create a new module export
module.exports = {
    // Create a function with required args
    queryHandler: function(m, a, c, tl) {
        // Create vars
        const message = m;
        let args = a;
        const client = c;
        const triggerList = tl;
        let commandName;
        // Create a db connection; pass in the logging option and set to false to prevent console logs
        const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

        // Check if the command has args
        if (!args.length) {
            // If no args, remove the prefix
            commandName = message.content.replace(`${prefix}`, '');
        } else {
            // If args, pull the command name and remove the prefix
            commandName = message.content.split(" ")[0].replace(`${prefix}`, '');
        };

        // Check if command has any aliases
        const command = client.commands.get(commandName.toLowerCase()) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName.toLowerCase()));

        /*
        ######################################
        ########## trigger commands ##########
        ######################################
        */
        if (command.name.includes("trigger")) {

            // Call the trigger handler function from the TriggersController file
            TriggersController.triggerHandler(command, sequelize, client, args, message, triggerList);

        /*
        #######################################
        ########## autorole commands ##########
        #######################################
        */
        } else if (command.name.includes("autorole")) {
            
            // Call the autoroles handler function from the AutorolesController file
            AutorolesController.autoroleHandler(command, sequelize, client, args, message);
        
        /*
        ###########################################
        ########## joinableroles command ##########
        ###########################################
        */
        } else if (command.name.includes("joinablerole") || command.name.includes("joinrole") || command.name.includes("leaverole")) {

            // Call the joinable roles handler function from the JoinableRolesController file
            JoinableRolesController.joinableRolesHandler(command, sequelize, client, args, message);

        /*
        ######################################
        ########## warnings command ##########
        ######################################
        */
        } else if (command.name === "warnings") {
            // Call the Warning handler function from the JoinableRolesController file
            WarningsController.warningHandler(sequelize, client, args, message);
        /*
        ####################################
        ########## testdb command ##########
        ####################################
        */
        } else if (command.name === 'testdb') {
            // Authenticate the sequelize object
            sequelize.authenticate()
            .then(() => {
                // If valid then let user know
                message.channel.send("Connection Successful!");
            })
            .catch(() => {
                // If inalid then let user know
                message.channel.send("Connection Failed!");
            });
        };
    },

    // Function for when bot starts up
    botReconnect: function(tl) {

        // Connect to Database
        const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

        // Create a trigger model/table connection
        const Trigger = sequelize.define('trigger', {
            // Create required trigger string column
            trigger: {
                type: Sequelize.STRING,
                allowNull: false
            },
            // Create required user_id text column
            user_id: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            severity: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            // Create required enabled bool column with default to true
            enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        });

        // Get all rows of enabled triggers and add them to the triggerList
        Trigger.findAll({
            where: {
                enabled: 1
            }
        }).then((data) => {
            data.forEach((item) => {
                tl.list.push(item.get('trigger'));
            });
        }).catch((e) => {
            // console.error("Error: "+e);
        });
    }
}