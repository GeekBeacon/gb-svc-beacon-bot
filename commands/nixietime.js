// Import required files
const Discord = require("discord.js");
const PermissionsController = require("../controllers/PermissionsController");
const moment = require("moment");

module.exports = {

    // Set config values
    name: 'nixietime',
    enabled: true,
    mod: false,
    super: false,
    admin: false,
    
    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`nixietime`)
    .setDescription(`Get information on or convert a time from normal human time to NixieTime!`)
    .addStringOption(option =>
        option.setName(`duration`)
        .setDescription(`The duration to calculate`)
        .setRequired(false)
    ),

    // Execute the command
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

                // If no option was given
                if(!interaction.options.getString(`duration`)) {
                    // Define NixieTime
                    interaction.reply(`NixieTime is defined as a function of NixieTime that represents the current time plus a nondeterministic random value denoting a temporal period. The exact value of the delta is unknown and changes constantly based on fluctuation in the space time continuum and doctor who paradoxes.`);
                } else {
                    const regex = /^((\d+)\s?(weeks|week|w|month|months|M|year|years|y|hours|hour|h|minutes|minute|min|mins|m|seconds|second|secs|sec|s|days|day|d)){1}$/;
                    let newArgs = interaction.options.getString(`duration`); //gets the duration provided
                    newArgs = newArgs.replace(" ", "").trim();

                    // Make sure the user input an accepted time duration
                    if(newArgs.match(regex)) {
                        let splitArgs = newArgs.split(/([\d]+)/).filter(i => i); //split the newArgs to get the amount and duration apart

                        const numArg = parseInt(splitArgs[0].trim()); //number argument
                        const durArg = splitArgs[1].trim(); //duration argument
                        const originalDur = moment.duration(numArg, durArg); //duration user provided
                        const durFormats = [`s`, `m`, `h`, `d`, `w`, `M`, `y`];
                        let randomNum;


                        // Decide the max for the random function based on the duration type
                        if([`s`, `sec`, `secs`, `second`, `seconds`, `m`, `min`, `mins`, `minute`, `minutes`].includes(durArg)) {

                            randomNum = Math.floor(Math.random() * (59 - numArg + 1) + numArg); //secs and mins
                        } else if([`h`, `hour`, `hours`].includes(durArg)) {

                            randomNum = Math.floor(Math.random() * (23 - 1) + 1); //hours
                        } else if([`d`, `day`, `days`].includes(durArg)) {
                            
                            randomNum = Math.floor(Math.random() * (6 - 1) + 1); //days
                        } else if([`w`, `week`, `weeks`].includes(durArg)) {

                            randomNum = Math.floor(Math.random() * (3 - 1) + 1); //weeks
                        } else if([`M`, `month`, `months`].includes(durArg)) {

                            randomNum = Math.floor(Math.random() * (11 - 1) + 1); //months
                        } else if([`y`, `year`, `years`].includes(durArg)) {

                            randomNum = Math.floor((Math.random() * 1000000) + 1); //years
                        };

                        // Get a random format to add to the original format
                        const randomFormat = durFormats[Math.floor(Math.random() * durFormats.length)];
                        // Get a random duration using the random number and format we received
                        const randomDur = moment.duration(parseInt(randomNum), randomFormat);
                        // Perform the calculation
                        const finalDur = originalDur.add(randomDur);

                        // Create an array with all the values from each duration type
                        let timeArr = [`${finalDur.years()}y`, `${finalDur.months()}mo`, `${finalDur.weeks()}w`, `${finalDur.days()}d`, `${finalDur.hours()}h`, `${finalDur.minutes()}m`, `${finalDur.seconds()}s`]

                        // Filter out any 0 values
                        timeArr = timeArr.filter(item => !item.match(/^(0*\D+)$/));

                        // Format the output
                        let finalTime = timeArr.join();
                        finalTime = finalTime.replace(/[,]+/g, " ");

                        // Send the message
                    interaction.reply(`If Nixie said it will be about *${newArgs}*, then it will really be about **${finalTime}**!`);

                    // If user didn't provide an accepted time duration let them know
                    } else {
                        interaction.reply(`Uh oh! Looks like you provided me with an invalid time duration. Please only use a number followed by a single duration.\n\nAccepted durations:\n\`s, sec, secs, second, seconds, m, min, mins, minute, minutes, h, hour, hours, d, day, days, w, week, weeks, M, month, months, y, year, years\`\n\nExamples: \`15m\` for 15 minutes, \`3d\` for 3 days, \`1M\` for 1 month!`);
                    }
                }
            }
        }


        
    }
};
