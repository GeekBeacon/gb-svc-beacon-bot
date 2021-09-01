// Require needed files/vars
const Sequelize = require('sequelize');
const {db_name, db_host, db_port, db_user, db_pass} = require("../config");

// Create a db connection; pass in the logging option and set to false to prevent console logs
const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

// Create a user model/table
const User = sequelize.define('user', {
    // Create required user_id text column
    user_id: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    // Create required level int column
    level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // Create required points BigInt column
    points: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
    }

}, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
});

module.exports = User;