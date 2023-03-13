// Import the required files
const Discord = require(`discord.js`);
const PermissionsController = require("../controllers/PermissionsController");
const Canvas = require(`@napi-rs/canvas`);

module.exports = {

    // Set config values
    name: 'hexcolor',
    enabled: true,
    mod: false,
    super: false,
    admin: false,

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`hexcolor`)
    .setDescription(`Generate or display a color!`)
    .addSubcommand(subcommand => 
        subcommand.setName(`generate`)
        .setDescription(`Generate a random hex color code.`)
    )
    .addSubcommand(subcommand => 
        subcommand.setName(`display`)
        .setDescription(`Display a hex color`)
        .addStringOption(option => 
            option.setName(`hex`)
            .setDescription(`The hex code to display.`)
            .setRequired(true)
        )
    ),

    // Execute the command
    async execute(interaction) {

        // Check if the command can be used (by the member)
        const enabled = await PermissionsController.enabledCheck(this, interaction);
        const approved = await PermissionsController.permissionCheck(this, interaction);

        // If the command is not enabled, let the member know
        if(!enabled) {
            return interaction.reply({content: `Uh oh! This command is currently disabled!`, ephemeral: true});
        // If the member doesn't have the proper permissions, let them know
        } else if (!approved) {
            return interaction.reply({content: `Uh oh! Looks like you don't have the proper permissions to use this command!`, ephemeral: true});
        // If the command is enabled and the user has permission to use it
        } else {
            const subcommand = interaction.options.getSubcommand();

            // If the generate subcommand was used
            if(subcommand === `generate`) {
                const hexVals = `0123456789ABCDEF`; //hexadecimal val string
                let finalHex = ``;


                // Loop 6 times to generate the 6 hexadecimal ints
                for(let i = 0; i <= 5; i++) {
                    const digit = hexVals[(Math.floor(Math.random()* 16))];
                    finalHex += `${digit}`;
                }

                // Create the canvas and load the context
                const canvas = Canvas.createCanvas(250,250);
                const context = canvas.getContext(`2d`);

                // Add the color to the context of the canvas
                context.fillStyle = `#${finalHex}`;
                context.fillRect(0, 0, canvas.width, canvas.height);

                // Create the image with the canvas
                const finalImage = new Discord.AttachmentBuilder(await canvas.encode(`png`), {name: `color-${finalHex}.png`});

                // Build the embed
                const embed = new Discord.EmbedBuilder()
                    .setColor(`#${finalHex}`)
                    .setTitle(`Here is your color!`)
                    .addFields(
                        {name: `Hex Code`, value: `\`#${finalHex}\``, inline: true},
                        {name: `Requested By`, value: `${interaction.member}`, inline: true}
                    )
                    .setImage(`attachment://${finalImage.name}`)
                    .setTimestamp();

                // Reply with the embed
                interaction.reply({embeds: [embed], files: [finalImage]});


            // If the display subcommand was used
            } else if (subcommand === `display`) {
                const hexRegex = new RegExp(/^#{0,1}([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
                let givenHex = interaction.options.getString(`hex`);



                if(hexRegex.test(givenHex) === true) {

                    // If the hex has the pound symbol
                    if(givenHex.startsWith(`#`)) {
                        // Remove the pound symbol
                        givenHex = givenHex.replace(`#`, ``);
                    }

                    // Create the canvas and load the context
                    const canvas = Canvas.createCanvas(250,250);
                    const context = canvas.getContext(`2d`);

                    // Add the color to the context of the canvas
                    context.fillStyle = `#${givenHex}`;
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    // Create the image with the canvas
                    const finalImage = new Discord.AttachmentBuilder(await canvas.encode(`png`), {name: `color-${givenHex}.png`});

                    // Build the embed
                    const embed = new Discord.EmbedBuilder()
                        .setColor(`#${givenHex}`)
                        .setTitle(`Here is your color!`)
                        .addFields(
                            {name: `Hex Code`, value: `\`#${givenHex}\``, inline: true},
                            {name: `Requested By`, value: `${interaction.member}`, inline: true}
                        )
                        .setImage(`attachment://${finalImage.name}`)
                        .setTimestamp();

                    // Reply with the embed
                    interaction.reply({embeds: [embed], files: [finalImage]});
                    

                } else {
                    // Let the member know that the provided input isn't a hex code
                    interaction.reply({content: `Uh oh! Looks like you provided an invalid hex code! Please try again or refer to [this guide](https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color "Click me to learn more!") for valid hexadecimal code formats!`, ephemeral: true, flags: Discord.MessageFlags.SuppressEmbeds})
                }
            }
        }
    }
};
