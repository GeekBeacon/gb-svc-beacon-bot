require('dotenv').config()
const Discord = require('discord.js');
const PermissionsController = require('../controllers/PermissionsController');
const config = require('../config');
const fs = require('node:fs');

module.exports = {

    // Set config values
    name: 'cmdrefresh',
    enabled: true,
    mod: false,
    super: false,
    admin: true,
    
    data: new Discord.SlashCommandBuilder()
    .setName(`cmdrefresh`)
    .setDescription(`Runs a copy of the deploy-commands.js file to refresh the bot's slash command collection!`)
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),
    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);
        
        // If the command is disabled then let the user know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});
        // If the command isn't disabled, proceed
        } else {
            // If the member doesn't have the proper permissions for the command
            if(!approved) {
                return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});

            // If the member has the proper permissions for the command
            } else {
                
                const commands = [];
                // Grab all the command files from the commands directory you created earlier
                const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));

                // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
                for (const file of commandFiles) {
                    const command = require(`${__dirname}/${file}`);
                    commands.push(command.data.toJSON());
                }

                // Construct and prepare an instance of the REST module
                const rest = new Discord.REST({ version: '10' }).setToken(config.token);

                // and deploy your commands!
                (async () => {
                    try {
                        console.log(`Started refreshing ${commands.length} slash commands.`);

                        // The put method is used to fully refresh all commands in the guild with the current set
                        const data = await rest.put(
                            Discord.Routes.applicationGuildCommands(config.client_id, config.server_id),
                            { body: commands },
                        );

                        console.log(`Successfully refreshed ${data.length} slash commands!`);
                        interaction.reply(`Successfully refreshed ${data.length} slash commands!`);
                    } catch (error) {
                        // Catch and log any errors!
                        console.error(error);
                    }
                })();
            }
        }

        
    }
}