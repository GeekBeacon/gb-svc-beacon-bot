// Require needed files/vars
const Sequelize = require('sequelize');
const {db_name, db_host, db_port, db_user, db_pass} = require("../config");

// Create a db connection; pass in the logging option and set to false to prevent console logs
const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

// Create a reactionrole model/table
const EmojiRole = sequelize.define('emojirole', {
    // Create required channel_id string column
    channel_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // Create required post_id string column
    post_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // Create required role_id string column
    role_id: {
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

module.exports = EmojiRole;