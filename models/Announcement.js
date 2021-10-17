// Require needed files/vars
const Sequelize = require('sequelize');
const {db_name, db_host, db_port, db_user, db_pass} = require("../config");

// Create a db connection; pass in the logging option and set to false to prevent console logs
const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

// Create a trigger model/table
const Announcement = sequelize.define('announcement', {
    // Create required title text column
    title: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    // Create required body text column
    body: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    // Create the required author text column
    author: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    // Create the required show_author bool column
    show_author: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    // Create the required channel text column
    channel: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    // Create required post_at date column
    post_at: {
        type: Sequelize.DATE,
        allowNull: false
    },
    // Create required reactions TEXT column
    reactions: {
        type: Sequelize.TEXT,
        allowNull: true
    }
}, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
});

module.exports = Announcement;