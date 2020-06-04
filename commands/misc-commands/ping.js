module.exports = {
    name: 'ping',
    description: 'Get response from bot with response time!\n*Default is Websocket ping*',
    aliases: ['rtime', 'responsetime'],
    cooldown: 5,
    mod: false,
    super: false,
    admin: false,
    usage: "[api | websocket]",
    execute(message, args) {
        let timestamp; //var for the message timestamp

        // If an edited message set timestamp to editedTimestamp
        if(message.editedTimestamp) {
            timestamp = message.editedTimestamp;

        // If not an edited message set timestamp to createdTimestamp
        } else {
            timestamp = message.createdTimestamp;
        }

        // If user asked for the api ping
        if (args[0] === "api") {
            message.channel.send("Pinging...").then(sent => {
                sent.edit(`Pong! ${sent.createdTimestamp - timestamp}ms`);
            });

        // If user asked for the websocket ping
        } else if(args[0] === "websocket") {
            message.channel.send("Pinging...").then(sent => {
                sent.edit(`Pong! ${Math.round( ( message.client.ws.ping + Number.EPSILON ) * 100 ) / 100}ms`);
            });

        // If user didn't give an argument default to api ping
        } else {
            message.channel.send("Pinging...").then(sent => {
                sent.edit(`Pong! ${sent.createdTimestamp - timestamp}ms`);
            });
        }
    },
};
