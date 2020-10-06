const AutoRole = require("./AutoRole");
const Ban = require("./Ban");
const BannedUrl = require("./BannedUrl");
const JoinableRole = require("./JoinableRole");
const Kick = require("./Kick");
const Mute = require("./Mute");
const TempChannel = require("./TempChannel");
const Trigger = require("./Trigger");
const Unban = require("./Unban");
const Unmute = require("./Unmute");
const Warning = require("./Warning");

module.exports = {
    autorole : AutoRole,
    ban : Ban,
    bannedurl : BannedUrl,
    joineableRole : JoinableRole,
    kick : Kick,
    mute : Mute,
    tempchannel : TempChannel,
    trigger : Trigger,
    unban : Unban,
    unmute : Unmute,
    warning : Warning,
}