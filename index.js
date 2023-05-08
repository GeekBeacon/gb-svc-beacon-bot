require('dotenv').config()

// Import required files
const Discord = require("discord.js");
const config = require("./config");
const fs = require("node:fs");
const path = require("node:path");
const MessageController = require("./controllers/MessageController");
const JoinController = require("./controllers/JoinController");
const LeaveController = require("./controllers/LeaveController");
const DatabaseController = require("./controllers/DatabaseController");
const ModerationController = require("./controllers/ModerationController");
const ThreadController = require("./controllers/ThreadController");
const VoiceController = require("./controllers/VoiceController");
const ReactionsController = require("./controllers/ReactionsController");
const InviteController = require(`./controllers/InviteController`);
const UserController = require(`./controllers/UserController`)
const Models = require("./models/AllModels");

// Instantiate a new Discord client and collection
const client = new Discord.Client({
    intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers, Discord.GatewayIntentBits.GuildModeration, Discord.GatewayIntentBits.MessageContent, Discord.GatewayIntentBits.GuildPresences, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.GuildMessageReactions, Discord.GatewayIntentBits.GuildVoiceStates, Discord.GatewayIntentBits.GuildInvites, Discord.GatewayIntentBits.GuildScheduledEvents],
    partials: [Discord.Partials.Message, Discord.Partials.Channel, Discord.Partials.Reaction]});
client.settings = new Discord.Collection(); //create a new collection for the settings from the db
client.commands = new Discord.Collection(); //create a new collection for commands
client.triggers = new Discord.Collection(); //create a new collection for triggers
client.blacklist = new Discord.Collection(); //create a new collection for blacklisted domains

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

// Create a new Set for deleted messages
let deleteSet = new Set();

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
    const settings = await Models.setting.findAll({raw:true});
    // Assign each setting to the settings collection
    settings.forEach((item) => {client.settings.set(item.name, item.value)});

    // Create the triggers table if it doesn't exist
    Models.trigger.sync();
    // Query the triggers table for all settings
    const triggers = await Models.trigger.findAll({raw:true});
    // Assign each trigger to the triggers collection
    triggers.forEach((item) => {
        // Create an object for the trigger's values
        let triggerValues = {"severity":item.severity, "enabled": item.enabled};
        client.triggers.set(item.trigger, triggerValues);
    });

    // Create the bannedurls table if it doesn't exist
    Models.bannedurl.sync();
    // Query the bannedurls table for all banned domains
    const bannedurls = await Models.bannedurl.findAll({raw:true});
    // Assign each bannedurl to the blacklist collection
    bannedurls.forEach((item) => {client.blacklist.set(item.id, item.url)});

    console.log('Bot Online!');
    
    // Set the presence of the bot
    client.user.setPresence({activities: [{name: `over GeekBeacon`, type: Discord.ActivityType.Watching}], status: `online`});

    // Call the method to query the database for various data
    try {
        DatabaseController.botReconnect(client);
    } catch(e) {
        console.error("Error: ", e);
    }

    // Check for unbans every minute
    setInterval(() => {
        try {
            DatabaseController.databaseCheck(client);
        } catch(e) {
            console.error("Error: ", e);
        }
    }, 60000)

});

// Listen for messages to be sent
client.on('messageCreate', async message => {
    // Call the function from /controllers/MessageController to handle the message
    try {
        MessageController.messageHandler(message, client, deleteSet);
    } catch (e) {
        console.error(e);
    };
});

// Listen for members to join the server
client.on('guildMemberAdd', member => {

    // Attempt to run the joinHandler method
    try {
        JoinController.joinHandler(member, client);
    } catch (e) {
        console.error(e);
    }
});

// Listen for members to leave the server
client.on('guildMemberRemove', member => {

    // Attempt to run the leaveHandler method
    try {
        LeaveController.leaveHandler(member, client);
    } catch (e) {
        console.error(e);
    }
});

// Listen for members to be updated
client.on('guildMemberUpdate', (oldMember, newMember) => {

    // Attempt to run the screeningHandler method
    try {
        JoinController.screeningHandler(oldMember, newMember);
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
                ModerationController.deleteHandler(message, client, deleteSet);
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
                    ModerationController.editHandler(oldMsg, fullMsg, client, deleteSet);

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
                ModerationController.editHandler(oldMsg, newMsg, client, deleteSet);

            // If the message is from a bot, ignore it
            } else {
                return;
            }
        }
    } catch (e) {
        console.error(e);
    }
});

// Listen for voice state updates
client.on("voiceStateUpdate", (oldState, newState) => {
    // Call the channel left handler from the voice controller
    VoiceController.voiceUpdateHandler(oldState, newState, client);
});

// Listen for reaction adds
client.on("messageReactionAdd", async (reaction, user) => {
    // Check if the reaction was a partial (used on an older message)
    if(reaction.partial) {
        // Try to cache the reaction
        try {
            await reaction.fetch().then(() => {
                // Call the reaction add handler from the reactions controller
                ReactionsController.reactionAdd(reaction, user);
            });
        // Catch the error
        } catch(e) {
            console.error("There was an error fetching the message from this reaction", e);
            return;
        }
    // If not a partial continue as normal
    } else {
        // Call the reaction add handler from the reactions controller
        ReactionsController.reactionAdd(reaction, user);
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
                ReactionsController.reactionRemove(reaction, user);
            });
        // Catch the error
        } catch(e) {
            console.error("There was an error fetching the message from this reaction", e);
            return;
        }
    // If not a partial continue as normal
    } else {
        // Call the reaction remove handler from the reactions controller
        ReactionsController.reactionRemove(reaction, user);
    }
});

client.on("interactionCreate", async interaction => {
    
    // Check if the interaction is a slash command with or without autocomplete or a modal
    if (interaction.isChatInputCommand() || interaction.isAutocomplete() || interaction.isModalSubmit()) {

        // If a normal slash command is used
        if (interaction.isChatInputCommand()) {

            // Create the command object with the command name given
            const command = interaction.client.commands.get(interaction.commandName);

            
            if(!command) return; //Ignore if the command wasn't found

            // Attempt to execute the command
            try {
                await command.execute(interaction);
            } catch(e) {
                console.error(e);
                await interaction.reply({content: `There was an error trying to execute that command, please try again!`, ephemeral: true})
            }

        // If the command has autocomplete
        } else if (interaction.isAutocomplete()) {

            // Create the command object with the command name given
            const command = interaction.client.commands.get(interaction.commandName);

            
            if(!command) return; //Ignore if the command wasn't found

            // Attempt to execute the autocomplete
            try {
                await command.autocomplete(interaction);
            } catch(e) {
                console.error(e);
                await interaction.reply({content: `There was an error trying to execute that command, please try again!`, ephemeral: true})
            }

        // If the interaction is a modal submission
        } else if (interaction.isModalSubmit()) {

            if(interaction.customId === `settingsModal`) {
                // Call the updateSetting function from the DatabaseController
                DatabaseController.updateSetting(interaction);
            }
        }

    // If not an interaction format we can handle
    } else {
        return;
    }
});

// Listen for a thread/post to be deleted
client.on("threadDelete", async (oldThread, newThread) => {

     // Attempt to run the deleteHandler method
    try {
        ThreadController.deleteHandler(oldThread, newThread);
    } catch (e) {
        return;
    }
});

// Listen for an invite to be created
client.on(Discord.Events.InviteCreate, async (invite) => {

    // Attempt to run the inviteCreate method
    try {
        InviteController.inviteCreate(invite, client);
    } catch(e) {
        return;
    }
});

// Listen for a member to be updated
client.on("guildMemberUpdate", async (oldMember, newMember) => {

    // Attempt to run the memberHandler method
   try {
       UserController.memberHandler(oldMember, newMember);
   } catch (e) {
       return;
   }
});

// Listen for a user to be updated
client.on("userUpdate", async (oldUser, newUser) => {

    // Attempt to run the userHandler method
   try {
       UserController.userHandler(oldUser, newUser);
   } catch (e) {
       return;
   }
});

// Log the client in
client.login(config.token);
