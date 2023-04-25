// Require needed files/vars
const Sequelize = require('sequelize');
const {db_name, db_host, db_port, db_user, db_pass} = require("../config");

// Create a db connection; pass in the logging option and set to false to prevent console logs
const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

// Create a namechange model/table
const NameChange = sequelize.define('namechange', {
    // Create required user_id text column
    user_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // Create required usernames text column
    usernames: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    // Create optional nicknames text column
    nicknames: {
        type: Sequelize.TEXT,
        allowNull: true
    }
}, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
});

module.exports = NameChange;