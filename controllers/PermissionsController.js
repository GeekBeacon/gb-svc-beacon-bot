module.exports = {

    // Check if the command is enabled
    enabledCheck: async function(cmd, interaction) {
        //Set the cmd's enabled value to that of the local collection's property value
        cmd.enabled = interaction.client.commands.get(cmd.name).enabled;

        // Return bool based on enabled state
        if(cmd.enabled === false) {
            return false;
        } else {
            return true;
        }

    },

    // Check the user's permissions
    permissionCheck: async function(cmd, interaction) {
        // Set this command's property values to the local collection's property values
        cmd.mod = interaction.client.commands.get(cmd.name).mod;
        cmd.super = interaction.client.commands.get(cmd.name).super;
        cmd.admin = interaction.client.commands.get(cmd.name).admin;

        // Check if the user is in any of the mod+ roles
        const trainee = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("trainee_role_id"));
        const mod = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("mod_role_id"));
        const superMod = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("super_role_id"));
        const admin = interaction.member.roles.cache.find(role => role.id === interaction.client.settings.get("admin_role_id"));
        const owner = interaction.member.id === interaction.guild.ownerId;

        // If the command is admin only and the member isn't an admin
        if(cmd.admin === true && !(admin || owner)) {
            return false;

        // If the command is super+ only and the member isn't a super+
        } else if(cmd.super === true && !(superMod || admin || owner)) {
            return false;

        // If the command is mod+ and the member isn't a trainee+
        } else if(cmd.mod === true && !(admin || superMod || mod || trainee || owner)) {
            return false;

        // If the user has the appropiate role return true
        } else {
            return true;
        }
    }
}