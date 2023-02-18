// Require needed files/vars
const Sequelize = require('sequelize');
const {db_name, db_host, db_port, db_user, db_pass} = require("../config");

// Create a db connection; pass in the logging option and set to false to prevent console logs
const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

// Create an tempchannel model/table
const Command = sequelize.define('command', {
    // Create the required channel id string column
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // Create required enabled bool column
    enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    // Create required trainee bool column
    trainee: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    // Create required mod bool column
    mod: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    // Create required super bool column
    super: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    // Create required admin bool column
    admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
},
{
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
});

module.exports = Command;