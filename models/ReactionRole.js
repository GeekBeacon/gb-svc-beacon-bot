// Require needed files/vars
const Sequelize = require('sequelize');
const {db_name, db_host, db_port, db_user, db_pass} = require("../config");

// Create a db connection; pass in the logging option and set to false to prevent console logs
const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

// Create a reactionrole model/table
const ReactionRole = sequelize.define('reactionrole', {
    // Create required role string column
    role: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // Create required emoji text column
    emoji: {
        type: Sequelize.TEXT,
        allowNull: false
    }
},
{
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
});

module.exports = ReactionRole;