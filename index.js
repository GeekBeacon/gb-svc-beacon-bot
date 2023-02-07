require('dotenv').config()

// Import required files
const Discord = require("discord.js");
const config = require("./config");
const fs = require("node:fs");
const path = require("node:path");
const messageController = require("./controllers/MessageController");
const joinController = require("./controllers/JoinController");
const leaveController = require("./controllers/LeaveController");
const databaseController = require("./controllers/DatabaseController");
const moderationController = require("./controllers/ModerationController");
const channelController = require("./controllers/ChannelController");
const voiceController = require("./controllers/VoiceController");
const reactionsController = require("./controllers/ReactionsController");
const Models = require("./models/AllModels");

// Instantiate a new Discord client and collection
const client = new Discord.Client({
    intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers, Discord.GatewayIntentBits.GuildBans, Discord.GatewayIntentBits.MessageContent, Discord.GatewayIntentBits.GuildPresences, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.GuildMessageReactions, Discord.GatewayIntentBits.GuildVoiceStates],
    partials: [Discord.Partials.Message, Discord.Partials.Channel, Discord.Partials.Reaction]});
client.settings = new Discord.Collection(); //create a new collection for the settings from the db
client.commands = new Discord.Collection(); //create a new collection for commands
client.triggers = new Discord.Collection(); //create a new collection for triggers

const commandsPath = path.join(__dirname, 'commands'); //get the commands dir
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); //get all the command files

// Loop through the command files
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Create a class for banned domains
class BannedDomainList {
    constructor() {
        this._list = [];
    }
    get list() {
        return this._list;
    }
    set list(domains) {
        this._list = domains;
    }
}
// Create a class for emojirole post
class EmojiRolePosts {
    constructor() {
        this._posts = [];
    }
    get posts() {
        return this._data;
    }
    set posts(ids) {
        this._posts = ids;
    }
}

// Instantiate classes
const triggerList = new TriggerList();
const bannedUrls = new BannedDomainList();
const emojiRolePosts = new EmojiRolePosts();

// Create a new Set for deleted messages
let deleteSet = new Set();

// Create vars
let dbCmds;
let settings;
let triggers;

//console.log(JSON.stringify(require("./config"), null, 4)) //shows the running config

// Stop the bot if any config vars are unassigned
let unassignedVars = [];
Object.entries(config).forEach(([key, value]) => {
    // Check the types to avoid a false positive with db_port
    if(typeof value === "string" || typeof value === "object") {
        // Check if the string or array is empty
        if(value === "" || !value.length) {
            // Add the key to the unassignedVars array
            unassignedVars.push(`${key}`);
        }
    }
});

// Check if there are any config vars without values
if(unassignedVars.length) {
    // If so then output them to the console and stop the process
    console.error(`Stopping process due to the following config variables missing values: ${unassignedVars.join(", ")}`)
    process.exit();
};

// Handle unhandled promise rejection warnings
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));

// Trigger once when the bot comes online
client.once('ready', async () => {

    // Create the settings table if it doesn't exist
    Models.setting.sync();
    // Query the settings table for all settings
    settings = await Models.setting.findAll({raw:true});
    // Assign each setting to the settings collection
    settings.forEach((item) => {client.settings.set(item.name, item.value)});

    // Create the triggers table if it doesn't exist
    Models.trigger.sync();
    // Query the settings table for all settings
    triggers = await Models.trigger.findAll({raw:true});
    // Assign each setting to the settings collection
    triggers.forEach((item) => {
        // Create a an object for the trigger's values
        let triggerValues = {"severity":item.severity, "enabled": item.enabled};
        client.triggers.set(item.trigger, triggerValues);
    });

    console.log('Bot Online!');
    
    // Set the status of the bot
    client.user.setStatus(`online`);

    // Populate the triggerList, bannedUrls, and emojiRolePosts and check for unbans/unmutes
    try {
        databaseController.botReconnect(triggerList, bannedUrls, emojiRolePosts, client);
    } catch(e) {
        console.error("Error: ", e);
    }

    // Check for unbans/unmutes every minute
    setInterval(() => {
        try {
            databaseController.databaseCheck(client);
        } catch(e) {
            console.error("Error: ", e);
        }
    }, 60000)

});

// Listen for messages to be sent
client.on('messageCreate', async message => {
    // Call the function from /controllers/MessageController to handle the message
    try {
        messageController.messageHandler(message, client, triggerList, bannedUrls, deleteSet, dbCmds, emojiRolePosts);
    } catch (e) {
        console.error(e);
    };
});

// Listen for members to join the server
client.on('guildMemberAdd', member => {

    // Attempt to run the joinHandler method
    try {
        joinController.joinHandler(member, client);
    } catch (e) {
        console.error(e);
    }
});

// Listen for members to leave the server
client.on('guildMemberRemove', member => {

    // Attempt to run the leaveHandler method
    try {
        leaveController.leaveHandler(member, client);
    } catch (e) {
        console.error(e);
    }
});

// Listen for members to be updated
client.on('guildMemberUpdate', (oldMember, newMember) => {

    // Attempt to run the screeningHandler method
    try {
        joinController.screeningHandler(oldMember, newMember);
    } catch(e) {
        console.error(e);
    }
});

// Listen for messages to be deleted
client.on("messageDelete", message => {
    
    // Make sure the author isn't null
    /* Uncached messages contain less data than caches */
    if (message.author) {

        // Make sure the message isn't from a bot
        if (message.author.bot === false) {

            // Attempt to run the deleteHandler method
            try {
                moderationController.deleteHandler(message, client, triggerList, deleteSet);
            } catch (e) {
                return;
            }

        // If the message is from a bot, ignore it
        } else {
            return;
        }
    }
});

// Listen for messages to be edited
client.on("messageUpdate", (oldMsg, newMsg) => {
    let fullMsg; //var in case of partial

    // Attempt to run the editHandler method
    try {

        // Check if the message is a partial (not cached)
        if(newMsg.partial) {
            // If a partial then fetch the full message
            newMsg.fetch().then(fullMessage => {
                fullMsg = fullMessage; //assign full message
            }).catch(e => {
                console.log("Error: ", e);

            // Once the full message is obtained proceed with the new fullMsg var instead of newMsg
            }).then(() => {
                // Make sure the message isn't from a bot
                /* Embeds counts as an edit so when the bot sends the embed it triggers this again.
                * Making this ignore bot messages prevent infinite loops or crashes.
                */
                if(fullMsg.author.bot === false) {
                    moderationController.editHandler(oldMsg, fullMsg, client, triggerList, bannedUrls, deleteSet);

                // If the message is from a bot, ignore it
                } else {
                    return;
                }
            });

        // If not a partial then proceed as normal
        } else {
            // Make sure the message isn't from a bot
            /* Embeds counts as an edit so when the bot sends the embed it triggers this again.
            * Making this ignore bot messages prevent infinite loops or crashes.
            */
            if(newMsg.author.bot === false) {
                moderationController.editHandler(oldMsg, newMsg, client, triggerList, bannedUrls, deleteSet);

            // If the message is from a bot, ignore it
            } else {
                return;
            }
        }
    } catch (e) {
        console.error(e);
    }
});

// Listen for channels to be created
client.on("channelCreate", channel => {
    // Call the function from /controllers/ChannelController to handle the message
    try {
        channelController.createHandler(channel);
    } catch (e) {
        console.error(e);
    };
});

// Listen for voice state updates
client.on("voiceStateUpdate", (oldState, newState) => {
    // Call the channel left handler from the voice controller
    voiceController.voiceUpdateHandler(oldState, newState, client);
});

// Listen for reaction adds
client.on("messageReactionAdd", async (reaction, user) => {
    // Check if the reaction was a partial (used on an older message)
    if(reaction.partial) {
        // Try to cache the reaction
        try {
            await reaction.fetch().then(() => {
                // Call the reaction add handler from the reactions controller
                reactionsController.reactionAdd(reaction, user, emojiRolePosts);
            });
        // Catch the error
        } catch(e) {
            console.error("There was an error fetching the message from this reaction", e);
            return;
        }
    // If not a partial continue as normal
    } else {
        // Call the reaction add handler from the reactions controller
        reactionsController.reactionAdd(reaction, user, emojiRolePosts);
    }
});

// Listen for reaction removals
client.on("messageReactionRemove", async (reaction, user) => {
    // Check if the reaction was a partial (used on an older message)
    if(reaction.partial) {
        // Try to cache the reaction
        try {
            await reaction.fetch().then(() => {
                // Call the reaction remove handler from the reactions controller
                reactionsController.reactionRemove(reaction, user, emojiRolePosts);
            });
        // Catch the error
        } catch(e) {
            console.error("There was an error fetching the message from this reaction", e);
            return;
        }
    // If not a partial continue as normal
    } else {
        // Call the reaction remove handler from the reactions controller
        reactionsController.reactionRemove(reaction, user, emojiRolePosts);
    }
});

client.on("interactionCreate", async interaction => {
    if(!interaction.isChatInputCommand()) return; //ignore chat commands

    // Create the command object with the command name given
    const command = interaction.client.commands.get(interaction.commandName);

    // Ignore if the command wasn't found
    if(!command) {
        return;
    }

    // Attempt to execute the command
    try {
        await command.execute(interaction);
    } catch(e) {
        console.error(e);
        await interaction.reply({content: `There was an error trying to execute that command, please try again!`, ephemeral: true})
    }
});

// Log the client in
client.login(config.token);
