// Import the required files
const Discord = require(`discord.js`);

module.exports = {

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
};
