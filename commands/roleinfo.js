const Discord = require(`discord.js`)

module.exports = {

    // Build the command
    data: new Discord.SlashCommandBuilder()
    .setName(`roleinfo`)
    .setDescription(`Get information about a specific role!`)
    .addRoleOption(option =>
        option
        .setName(`role`)
        .setDescription(`The role you want info about.`)
        .setRequired(true)
        ),
    // Execute the command
    async execute(interaction) {
        const role = interaction.options.getRole(`role`); //get the role the user provided
        let memberCount = 0;

        // Get the member count
        role.members.forEach(() => {
            memberCount++;
        });

        // Create the embed
        const roleEmbed = {
            color: `${role.color}`,
            description: `Information for the ${role} role`,
            fields: [
                {
                    name: `Members`,
                    value: `${memberCount}`,
                    inline: true,
                },
                {
                    name: `Color`,
                    value: `${role.hexColor}`,
                    inline: true,
                },
                {
                    name: `Mentionable`,
                    value: `${role.mentionable}`,
                    inline: true,
                },
                {
                    name: `Hoisted`,
                    value: `${role.hoist}`,
                    inline: true,
                },
                {
                    name: `Managed Externally`,
                    value: `${role.managed}`,
                    inline: true,
                },
                {
                    name: `Position`,
                    value: `${role.position +1}`, //add 1 to make it human readable
                    inline: true,
                },
            ],
            timestamp: new Date(),
            footer: {
                text: `Role ID: ${role.id}`
            },
        };

        // Send the embed
        interaction.reply({embeds: [roleEmbed]});
    }
}