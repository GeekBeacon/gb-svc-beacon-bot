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


    // name: 'ping',
    // description: 'Get response from bot with response time!\n*Default is Websocket ping*',
    // aliases: ['rtime', 'responsetime'],
    // cooldown: 5,
    // enabled: true,
    // mod: false,
    // super: false,
    // admin: false,
    // usage: "[api | websocket]",
    // execute(message, args) {
    //     let timestamp; //var for the message timestamp

    //     // If an edited message set timestamp to editedTimestamp
    //     if(message.editedTimestamp) {
    //         timestamp = message.editedTimestamp;

    //     // If not an edited message set timestamp to createdTimestamp
    //     } else {
    //         timestamp = message.createdTimestamp;
    //     }

    //     // If user asked for the api ping
    //     if (args[0] === "api") {
    //         message.channel.send("Pinging...").then(sent => {
    //             sent.edit(`Pong! ${sent.createdTimestamp - timestamp}ms`);
    //         });

    //     // If user asked for the websocket ping
    //     } else if(args[0] === "websocket") {
    //         message.channel.send("Pinging...").then(sent => {
    //             sent.edit(`Pong! ${Math.round( ( message.client.ws.ping + Number.EPSILON ) * 100 ) / 100}ms`);
    //         });

    //     // If user didn't give an argument default to api ping
    //     } else {
    //         message.channel.send("Pinging...").then(sent => {
    //             sent.edit(`Pong! ${sent.createdTimestamp - timestamp}ms`);
    //         });
    //     }
    // },
};
