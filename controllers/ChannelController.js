module.exports = {
    createHandler: async function(ch) {
        const channel = ch;
        const mutedServer = channel.guild.roles.cache.find(r => r.name === "Muted - Server"); //muted server role
        const mutedVoice = channel.guild.roles.cache.find(r => r.name === "Muted - Voice"); //muted voice role
        const mutedText = channel.guild.roles.cache.find(r => r.name === "Muted - Text"); //muted text role
        const mutedReactions = channel.guild.roles.cache.find(r => r.name === "Muted - Reactions"); //muted Reactions role

        // Set the permissions for the newly created channel for the Muted - Server role
        await channel.permissionOverwrites.edit(mutedServer, {
            SEND_MESSAGES: false,
            SPEAK: false,
            ADD_REACTIONS: false,
            USE_VAD: false,
            USE_PUBLIC_THREADS: false,
            USE_PRIVATE_THREADS: false
        });

        // Set the permissions for the newly created channel for the Muted - Voice role
        await channel.permissionOverwrites.edit(mutedVoice, {
            SPEAK: false,
            USE_VAD: false
        });

        // Set the permissions for the newly created channel for the Muted - Text role
        await channel.permissionOverwrites.edit(mutedText, {
            SEND_MESSAGES: false,
            USE_PUBLIC_THREADS: false,
            USE_PRIVATE_THREADS: false
        });

        // Set the permissions for the newly created channel for the Muted - Reactions role
        await channel.permissionOverwrites.edit(mutedReactions, {
            ADD_REACTIONS: false,
        });
    }
}