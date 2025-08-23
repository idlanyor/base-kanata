import Group from '../database/models/Group.js'

export const handler = {
    command: ['ginfo', 'groupinfo', 'info'],
    help: 'Show group and member information',
    tags: ['moderation'],
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, args }) => {
        try {
            if (!m.isGroup) {
                return await m.reply('❌ *Group Only*\nThis command can only be used in groups.')
            }

            const groupId = m.chat
            const settings = await Group.getSettings(groupId)
            const groupMetadata = await sock.groupMetadata(groupId)
            
            // Get member info if mentioned
            const targetJid = m.mentionedJid?.[0]
            let memberInfo = null
            
            if (targetJid) {
                const warnings = await Group.getMemberWarnings(groupId, targetJid)
                const isBanned = await Group.isMemberBanned(groupId, targetJid)
                const warningCount = warnings.length
                
                memberInfo = {
                    id: targetJid,
                    name: groupMetadata.participants.find(p => p.id === targetJid)?.name || 'Unknown',
                    warnings: warningCount,
                    isBanned: isBanned,
                    warningHistory: warnings.slice(-3) // Last 3 warnings
                }
            }

            // Group statistics
            const totalMembers = groupMetadata.participants.length
            const admins = groupMetadata.participants.filter(p => p.admin).length
            const bannedMembers = settings.bannedMembers.length
            const totalWarnings = Object.values(settings.warnedMembers).reduce((sum, warnings) => sum + warnings.length, 0)

            const infoMsg = `📊 *Group Information*

🏷️ *Group Name:* ${groupMetadata.subject}
📝 *Description:* ${groupMetadata.desc || 'No description'}
👥 *Total Members:* ${totalMembers}
👮 *Admins:* ${admins}
🚫 *Banned Members:* ${bannedMembers}
⚠️ *Total Warnings:* ${totalWarnings}

📈 *Group Statistics:*
• Messages: ${settings.stats.messages}
• Commands: ${settings.stats.commands}
• Kicks: ${settings.stats.kicks}
• Bans: ${settings.stats.bans}
• Warnings: ${settings.stats.warnings}

🛡️ *Moderation Settings:*
• Welcome: ${settings.welcome ? '✅ On' : '❌ Off'}
• Goodbye: ${settings.goodbye ? '✅ On' : '❌ Off'}
• Anti-Spam: ${settings.antiSpam ? '✅ On' : '❌ Off'}
• Anti-Link: ${settings.antiLink ? '✅ On' : '❌ Off'}
• Anti-Toxic: ${settings.antiToxic ? '✅ On' : '❌ Off'}
• Anti-Media: ${settings.antiMedia ? '✅ On' : '❌ Off'}

${memberInfo ? `
👤 *Member Information:*
• Name: ${memberInfo.name}
• Warnings: ${memberInfo.warnings}/3
• Status: ${memberInfo.isBanned ? '🚫 Banned' : '✅ Active'}
${memberInfo.warningHistory.length > 0 ? `
📋 *Recent Warnings:*
${memberInfo.warningHistory.map((w, i) => 
    `${i + 1}. ${w.reason} (${new Date(w.warnedAt).toLocaleDateString('id-ID')})`
).join('\n')}` : ''}` : ''}

💡 *Quick Commands:*
• \`!warn @user\` - Warn a member
• \`!kick @user\` - Kick a member
• \`!ban @user\` - Ban a member
• \`!groupset\` - Configure settings`

            await m.reply(infoMsg)

        } catch (error) {
            console.error('Group info error:', error)
            await m.reply('❌ *Error*\nFailed to load group information. Please try again.')
        }
    }
}

export default handler