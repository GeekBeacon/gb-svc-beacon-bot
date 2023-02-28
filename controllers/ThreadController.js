const Discord = require(`discord.js`);

module.exports = {
    deleteHandler: async function(oldThread, newThread) {

        // If the thread was deleted
        if(!newThread) {
            const actionLog = oldThread.guild.channels.cache.find((c => c.name.includes(oldThread.client.settings.get("mod_log_channel_name")))); //mod log channel
            const creator = await oldThread.client.users.fetch(oldThread.ownerId); //get the creator of the thread

            // Object for all channel types
            const channelTypes = {10: "Announcement Thread", 1: "Direct Message", 3: "Group Direct Message", 5: "Announcement", 4: "Category", 15: "Forum", 12: "Private Thread", 11: "Thread", 13: "Stage", 0: "Text", 2: "Voice"}

            // Create the embed
            const deleteEmbed = new Discord.EmbedBuilder()
                .setColor(`#33CCFF`)
                .setTitle(`Thread/Forum Post Deleted`)
                .setDescription(`A thread or forum post was deleted!`)
                .setAuthor({name: `${creator.tag}`, iconURL: `${creator.displayAvatarURL({dynamic: true})}`})
                .addFields(
                    {
                        name: `Created By`,
                        value: `${creator}`,
                        inline: true
                    },
                    {
                        name: `Created At`,
                        value: `${Discord.time(oldThread.createdAt, "R")}`,
                        inline: true
                    },
                    {
                        name: `Type`,
                        value: `${channelTypes[oldThread.parent.type]}`,
                        inline: true
                    },
                    {
                        name: `Members`,
                        value: `${oldThread.memberCount}`,
                        inline: true
                    },
                    {
                        name: `Messages`,
                        value: `${oldThread.messageCount}`,
                        inline: true
                    },
                    {
                        name: `Parent Channel`,
                        value: `${oldThread.parent}`,
                        inline: true
                    }
                    
                )
                .setTimestamp();

            // Send the embed to the mod log
            actionLog.send({embeds: [deleteEmbed]});
        }
    }
}