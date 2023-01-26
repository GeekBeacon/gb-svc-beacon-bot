// Import the required files
const Discord = require(`discord.js`);

module.exports = {

    // Set config values
    name: 'ping',
    enabled: true,
    mod: false,
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
        // Set this command's property values to the local collection's property values
        this.enabled = interaction.client.commands.get(this.name).enabled;
        this.mod = interaction.client.commands.get(this.name).mod;
        this.super = interaction.client.commands.get(this.name).super;
        this.admin = interaction.client.commands.get(this.name).admin;

        // If the command is disabled then let the user know
        if(this.enabled === false) {
            return interaction.reply({content: `Uh oh! This commend is currently disabled!`, ephemeral: true});
        }

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
