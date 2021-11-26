// Import required files
const moment = require("moment");
const Models = require("../models/AllModels");
const Discord = require('discord.js');

module.exports = {
    emojiRoleHandler: async function(message, args, client) {
        const prefix = client.settings.get("prefix");

        // Run the proper function based on the subcommand given
        switch(args[0].toLowerCase()) {
            case "add":
                addRole();
                break;
            case "remove":
                removeRole();
                break;
            default:
                break;
        }

        // Function to add a role to the post to be joinable
        function addRole() {

        }

        // Function to remove a role from the post to become unjoinable
        function removeRole() {

        }
    }
}