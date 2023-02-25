const AutoRole = require("./AutoRole");
const Ban = require("./Ban");
const BannedUrl = require("./BannedUrl");
const Command = require("./Command");
const JoinableRole = require("./JoinableRole");
const Kick = require("./Kick");
const Timeout = require("./Timeout");
const Setting = require("./Setting");
const TempChannel = require("./TempChannel");
const Trigger = require("./Trigger");
const Unban = require("./Unban");
const User = require("./User");
const Warning = require("./Warning");

module.exports = {
    autorole : AutoRole,
    ban : Ban,
    bannedurl : BannedUrl,
    command : Command,
    joineableRole : JoinableRole,
    kick : Kick,
    timeout : Timeout,
    setting : Setting,
    tempchannel : TempChannel,
    trigger : Trigger,
    unban : Unban,
    user : User,
    warning : Warning,
}