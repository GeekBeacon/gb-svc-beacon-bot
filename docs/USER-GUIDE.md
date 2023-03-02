---
id: user_guide
title: User Guide
sidebar_label: User Guide
---
# BeaconBot Usage Guide

BeaconBot is a bot created with GeekBeacon in mind. There are many commands for this bot, and more to come. Because of this, we thought it would be best to have a guide explaining how to use each command and feature of the bot!

**Command Usage Legend**
All commands use the slash functionality of Discord, so simply typing a forward slash `/` will populate the menu with commands, you can filter to just BeaconBot commands by clicking its icon on the left side. Additionally, you can start typing a command's name to narrow down the results to only commands that match what you type; This works for top level and sub commands!

* `<>` means that you **must** include an argument with the command
* `[]` means that it is **optional** to include an argument
* `N/A` means that no argument is required/accepted
* `Mod` referrs to users in the Mod Trainee and Moderators group
* `Super` referrs to the users in the Master Control group
* `Admin` referrs to users in the Botmasters group
* `Owner` referrs to the server owner

**Discord Terminology**

* `User` referrs to any user on Discord
* `Member` referrs to a member that is part of the guild
* `Guild` referrs to the Discord server itself

___

Here is a quick list of features/modules, click on any one to jump to its' information and commands!

* [Autoroles](#autoroles)
* [Joinable Roles](#joinable-roles)
* [Moderation](#moderation)
* [Triggers (blacklisted words/phrases)](#triggers)
* [Informative](#Informative)
* [Miscellaneous](#Miscellaneous)

___


## Autoroles

Autoroles are a way to automatically assign roles when a user joins the server and completes the screening process.

#### **Command(s) Usage**

| Command     | Argument(s) | Description | Role | Example |
| --- | :---: | --- | :---: | --- |
autorole add | \<role\> | Adds a role to the autoroles list | Super | /autorole add \<Role\>
autorole list | N/A | Lists all current autoroles | Mod | /autorole list
autorole remove | \<role\> | Removes a role from the autorole list | Super | /autorole remove \<Role\>


___

## Joinable Roles

Joinable roles are a way that members can join a specific role.

#### **Command(s) Usage**

| Command     | Argument(s) | Description | Role | Example |
| --- | :---: | --- | :---: | --- |
joinable add | \<role\> | Adds a role to the joinable roles | Super | /joinable add \<Role\>
joinable join | \<role\> | Adds you to a joinable role | Users | /joinable join \<Role\>
joinable leave | \<role\> | Removes you from a joinable role | Users | /joinable leave \<Role\>
joinable list | N/A | Displays all joinable roles | Users | /joinable list
joinable remove | \<role\> | Removes a role from the joinable roles | Super | /joinable remove \<Role\>

___

## Moderation
Moderation commands are used to allow Trainees, Moderators, and Super Moderators (Master Control) to manage the Discord server more effectively. There are many moderation commands, and many more planned!

**Here is a simple list of all the features:**

* Logs
   * Message/Thread Deleted
   * Message/Thread Edited
   * User Joined
   * User Left
   * User Kicked
   * User Banned
   * User Unbanned
   * User Timedout
   * User Timeout Removed
   * User Warned
* Purge Message
* Kick Member
* Ban User
* Unban User
* List Bans
* Warn Member
* Timeout Member
* Remove Member Timeout
* Blacklist
   * List
   * Add
   * Remove
* Slowmode
* Add/Remove Role
* Create temporary voice channels
* Command Toggle
   * Disable Command
   * Enable Command



| Command     | Argument(s) | Description | Role | Example |
| --- | :---: | --- | :---: | --- |
ban | \<user\>, \<reason\>, \<time\>* | Bans a user from the guild | Mod | /ban \<User\> graphic content 1w
bans recent | N/A | Displays the 10 most recent bans | Mod | /bans recent
bans specific | \<ban id\> | Displays information on a specific ban | Mod | /bans 2
blacklist add | \<domain\>* | Adds a url to the blacklisted urls | Mod | /blacklist add site1<span>.</span>com
blacklist list | N/A | List the blacklisted urls | Mod | /blacklist list
blacklist remove | \<domain\>* | Removes a url from the blacklisted urls | Mod | /blacklist remove site1<span>.</span>com
cmdrefresh | N/A | Refreshes the registered slash commands | Admin | /cmdrefresh
cmdtoggle | \<command name\> | Toggles a command to be enabled or disabled | Admin | /cmdtoggle ping
kick | \<member\>, \<reason\> | Kicks a member from the guild | Mod | /kick \<Member\> spamming
nickname reset | \<member\> | Resets a member's nickname back to their username | Mod | /nickname \<Member\>
nickname set | \<member\> \<nickname\> | Changes the member's nickname | Mod | /nickname \<Member\> Bambi
purge | \<count\> [Channel] | Bulk deletes messages in the current channel or, optionally a specified channel | Mod | /purge 25 
role add | \<member\> \<role\> | Gives a role to a member | Mod | /role add \<Member\> \<Role\>
role remove | \<member\> \<role\> | Removes a role from a member | Mod | /role remove \<Member\> \<Role\>
settings update | \<setting name\> | Modifies a setting in the database | Admin | /settings update mod_role_id
settings view | \<setting name\> | View the value of a setting in the database | Mod | /settings view mod_role_id
settings list | N/A | Lists all the settings in the database | Mod | /settings list
slow | \<channel\> \<interval\> | Toggles slowmode on or off for a specific channel | Mod | /slow \<Channel\> 15
testdb | N/A | Run a test to ensure the database is working | Admin | /testdb
timeout add | \<member\>, \<minutes\>*, \<reason\> | Puts a timeout on the member, preventing them from sending messages, adding reactions, or talking | /timeout add \<Member\> 180 spamming
timeout remove | \<mention \| user id\> \<reason\> | Removes the timeout from the member | Mod | /timeout remove \<Member\> apologized
unban | \<user id\>, \<reason\> | Unbans a user from the guild | Mod | /unban 12345 apologized
warnings new | \<member\> \<reason\> | Gives a new warning to a member | Mod | /warnings mew \<Member\> spamming
warnings recent | \<amount\> | Provides a list of the most recent warnings | Mod | /warnings recent 10
warnings specific | \<warning id\> | Look up a specific warning | Mod | /warnings specific 123
warnings user | \<member\> \<reason\> | Gets the warnings for a specific user | Mod | /warnings user \<User\>* spamming


\*User - You can provide either a user object or a user's id and Discord will provide the user, if they exist

\*time - This can be any format supported by [Moment's Add method (including shorthands)](https://momentjs.com/docs/#/manipulating/add/) or `perm`, `perma`, and `permanent` for a permanent ban (999 years)

\*domain - **IMPORTANT!** When adding domains to the blacklist, make sure not to use subdomains, these are automatically checked for!
___

## Triggers

Triggers are ways to ensure specific words or phrases aren't used within the guild. Supports excluding specific channels.

### Automation Behavior

Triggers have severity levels; low, medium, and high. These are used to determine how the bot will take action. Any time a trigger is seen, the bot will create a log about it in the mod log channel. This follows role hierarchy; meaning that if a mod posts a trigger word/phrase in a non-excluded channel it will report to the super mods (Master Control) and so forth.

**Here is a simple outline of how the bot handles triggers by severity:**
* **High** - These triggers have no place within the guild. Because of this, when these are seen, the bot will instantly delete the message, create a log of it in the appropiate log channel and send a message tagging @here to let the online mods know that further action may be required.
* **Medium** - These triggers are important to keep an eye out for. Because of this, the bot will ask the offender to refrain from using the word/phrase.
* **Low** - These triggers aren't as serious, but might need to be kept in specific channels. When these are used the bot will ask the user to refrain from using the word/phrase.


#### **Command(s) Usage**

| Command     | Argument(s) | Description | Role | Example |
| --- | :---: | --- | :---: | --- |
trigger add | \<word/phrase\>, \<low \| medium \| high\> | Adds a word/phrase to the trigger list | Super | /trigger add baciagaloop medium
trigger disable | \<trigger\> | Disables a trigger in the trigger list | Super | /trigger disable baciagaloop
trigger enable | \<trigger\> | Enables a trigger in the trigger list | Super | /trigger enable baciagaloop
trigger list | \[trigger\] | Displays all the current triggers, optionally displays information about a specific trigger | Mod | /trigger list
trigger remove | \<trigger\> | Removes a trigger word/phrase from the trigger list | Admin | /trigger remove baciagaloop

___

## Informative
These are commands that provide information about various things within the server.

#### **Command(s) Usage**

| Command     | Argument(s) | Description | Role | Example |
| --- | :---: | --- | :---: | --- |
leaderboard | N/A | Displays the 10 members with the most points in the guild | Members | /leaderboard
memberinfo | \[member\] | Displays information about your account, optionally displays information about other members | Members | /memberinfo \<Member\>
roleinfo | \<role\> | Gives information on a specific role | Members | /roleinfo \<Role\>
serverinfo | N/A | Displays information on the guild | Members | /serverinfo
___

## Miscellaneous
These are commands that don't fit into any other category.

#### **Command(s) Usage**

| Command     | Argument(s) | Description | Role | Example |
| --- | :---: | --- | :---: | --- |
ping | \[type\] | Gets the response time for the Discord api or the bot's websocket. Defaults to websocket if no argument provided | Members | /ping
usage | N/A | Provides a link to this guide | Members | /usage
github | N/A | Provides a link to the bot's repo | Members | /github
nixietime | \[time\]* | Defines what NixieTime is, optionally converts a time to NixieTime | Members | /nixietime 30mins
tempvoice | \<channel name\>, \[user limit\] | Creates a temporary channel that self-deletes when emptied | Members | /tempvoice cool channel

\*time - This can be any format supported by [Moment's Add method (including shorthands)](https://momentjs.com/docs/#/manipulating/add/) or `perm`, `perma`, and `permanent` for a permanent ban (999 years)
___

## Final Notes

There are many more features and commands planned or already in the works! If you have any suggestions or find any issues feel free to [create an issue](/issues) or even contribute yourself by joining [our Discord](https://discord.gg/geekbeacon)!