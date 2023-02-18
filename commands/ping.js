// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");

module.exports = {

    // Set config values
    name: 'ping',
    enabled: true,
    mod: true,
    super: false,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`ping`)
    .setDescription(`Ping the bot for a response from either the API or Websocket!`)
    .addStringOption(option =>
        option.setName(`type`)
        .setDescription(`The type of ping to execute.`)
        .setRequired(false)
        .addChoices(
            {name: `API`, value: `api`},
            {name: `Websocket`, value: `websocket`}
        )),

    // Execute the command
    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);

        // If the command is not enabled, let the member know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This commend is currently disabled!`, ephemeral: true});
        // If the member doesn't have the proper permissions, let them know
        } else if (!approved) {
            return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this subcommand!`, ephemeral: true});
        // If the command is enabled and the user has permission to use it
        } else {
            const pingType = interaction.options.getString(`type`) ?? `websocket`; // get the ping type or default to websocket

            // If user asked for the api ping
            if (pingType === "api") {
                const sent = await interaction.reply({ content: `Pinging...`, fetchReply: true});
                interaction.editReply(`Pong! API response time: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);

            // If user asked for the websocket ping
            } else if(pingType === "websocket") {
                interaction.reply(`Pong! Websocket response time: ${Math.round( ( interaction.client.ws.ping + Number.EPSILON ) * 100 ) / 100}ms`);
            }
        }
    }
};
