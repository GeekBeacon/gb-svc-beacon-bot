// Require needed files/vars
const Sequelize = require('sequelize');
const {db_name, db_host, db_port, db_user, db_pass} = require("../config");

// Create a db connection; pass in the logging option and set to false to prevent console logs
const sequelize = new Sequelize(`mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`, {logging: false});

// Create a warning model/table
const Warning = sequelize.define('warning', {
    
    /****** Fields for all warnings ******/
    type: {
        type: Sequelize.STRING,
        allowNull: false
    },
    user_id: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    username: {
        type: Sequelize.TEXT
    },
    nickname: {
        type: Sequelize.TEXT
    },

    /****** Fields for manual warnings ******/
    reason: {
        type: Sequelize.TEXT
    },
    mod_id: {
        type: Sequelize.TEXT
    },
    dm: {
        type: Sequelize.BOOLEAN
    },

    /****** Fields for triggers warnings ******/
    triggers: {
        type: Sequelize.TEXT
    },
    message: {
        type: Sequelize.TEXT
    },
    message_link: {
        type: Sequelize.TEXT
    },
    severity: {
        type: Sequelize.STRING
    },
    channel_id: {
        type: Sequelize.TEXT
    },

    /****** Field for Banned URL warnings ******/
    banned_url: {
        type: Sequelize.TEXT
    },

    /****** Field for timeout warnings ******/
    timeout_end_date: {
        type: Sequelize.DATE
    }
},
{
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
});

module.exports = Warning;