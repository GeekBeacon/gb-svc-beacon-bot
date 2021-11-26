const Announcement = require("./Announcement");
const AutoRole = require("./AutoRole");
const Ban = require("./Ban");
const BannedUrl = require("./BannedUrl");
const Command = require("./Command");
const JoinableRole = require("./JoinableRole");
const Kick = require("./Kick");
const Mute = require("./Mute");
const ReactionRole = require("./ReactionRole");
const Setting = require("./Setting");
const TempChannel = require("./TempChannel");
const Trigger = require("./Trigger");
const Unban = require("./Unban");
const Unmute = require("./Unmute");
const User = require("./User");
const Warning = require("./Warning");

module.exports = {
    announcement : Announcement,
    autorole : AutoRole,
    ban : Ban,
    bannedurl : BannedUrl,
    command: Command,
    joineableRole : JoinableRole,
    kick : Kick,
    mute : Mute,
    reactionrole : ReactionRole,
    setting : Setting,
    tempchannel : TempChannel,
    trigger : Trigger,
    unban : Unban,
    unmute : Unmute,
    user : User,
    warning : Warning,
}