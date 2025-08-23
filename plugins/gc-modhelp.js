export const handler = {
    command: ['modhelp', 'moderationhelp', 'ghelp'],
    help: 'Show group moderation commands help',
    tags: ['moderation'],
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        const helpMsg = `🛡️ *Group Moderation Commands*

📋 *Basic Moderation:*
• \`!kick @user [reason]\` - Kick a member from group
• \`!ban @user [reason]\` - Ban a member from group
• \`!unban @user\` - Unban a member from group
• \`!warn @user [reason]\` - Warn a member
• \`!promote @user\` - Promote member to admin
• \`!demote @user\` - Demote admin to member

⚙️ *Group Settings:*
• \`!groupset\` - Show current group settings
• \`!groupset welcome on/off [message]\` - Enable/disable welcome
• \`!groupset goodbye on/off [message]\` - Enable/disable goodbye
• \`!groupset antispam on/off [threshold] [action]\` - Anti-spam
• \`!groupset antilink on/off [action] [whitelist...]\` - Anti-link
• \`!groupset antitoxic on/off [action] [words...]\` - Anti-toxic
• \`!groupset antimedia on/off [action] [types...]\` - Anti-media
• \`!groupset autodelete on/off [delay]\` - Auto-delete commands
• \`!groupset logging on/off [log_group]\` - Enable logging

📊 *Information:*
• \`!ginfo [@user]\` - Show group/member information
• \`!del\` - Delete replied message (admin only)

🛡️ *Auto-Moderation Features:*
• Anti-Spam: Detects and acts on spam messages
• Anti-Link: Blocks unauthorized link sharing
• Anti-Toxic: Filters inappropriate language
• Anti-Media: Controls media sharing
• Welcome/Goodbye: Automatic messages for join/leave
• Auto-Delete: Automatically deletes command messages
• Logging: Logs moderation actions to another group

⚡ *Actions Available:*
• warn - Give warning to member
• kick - Remove member from group
• ban - Ban member permanently

📋 *Usage Examples:*
• \`!groupset antispam on 5 warn\` - Enable anti-spam with 5 message threshold
• \`!groupset antilink on kick youtube.com facebook.com\` - Enable anti-link with whitelist
• \`!warn @user Spam detected\` - Warn user for spamming
• \`!ban @user Repeated violations\` - Ban user permanently

💡 *Tips:*
• Only admins can use moderation commands
• Bot must be admin for kick/ban/promote/demote
• Warnings accumulate (3 warnings = auto-ban)
• Banned members cannot rejoin unless unbanned
• Use \`!groupset\` to configure auto-moderation

🔧 *Configuration:*
• Threshold: Number of violations before action
• Action: warn/kick/ban
• Whitelist: Allowed domains for anti-link
• Toxic words: Banned words for anti-toxic
• Media types: image/video/audio/document

📞 *Need Help?*
Contact group admin for moderation support.`

        await m.reply(helpMsg)
    }
}

export default handler