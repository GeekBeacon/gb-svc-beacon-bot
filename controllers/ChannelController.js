module.exports = {
    createHandler: async function(ch) {
        const channel = ch;
        const mutedServer = channel.guild.roles.cache.find(r => r.name === "Muted - Server"); //muted server role
        const mutedVoice = channel.guild.roles.cache.find(r => r.name === "Muted - Voice"); //muted voice role
        const mutedText = channel.guild.roles.cache.find(r => r.name === "Muted - Text"); //muted text role
        const mutedReactions = channel.guild.roles.cache.find(r => r.name === "Muted - Reactions"); //muted Reactions role

        // Set the permissions for the newly created channel for the Muted - Server role
        await channel.permissionOverwrites.edit(mutedServer, {
            SendMessages: false,
            Speak: false,
            AddReactions: false,
            UseVAD: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false
        });

        // Set the permissions for the newly created channel for the Muted - Voice role
        await channel.permissionOverwrites.edit(mutedVoice, {
            Speak: false,
            UseVAD: false
        });

        // Set the permissions for the newly created channel for the Muted - Text role
        await channel.permissionOverwrites.edit(mutedText, {
            SendMessages: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false
        });

        // Set the permissions for the newly created channel for the Muted - Reactions role
        await channel.permissionOverwrites.edit(mutedReactions, {
            AddReactions: false,
        });
    }
}