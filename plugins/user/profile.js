import User from '../../database/models/User.js'
import { PREMIUM_PLANS } from '../../database/models/User.js'

export const handler = {
    command: ['profile', 'profil', 'me', 'stats'],
    tags: ['user'],
    help: 'View your profile and statistics',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            const targetJid = m.mentionedJid?.[0] || m.sender
            const user = await User.getById(targetJid)
            
            if (!user.registered) {
                return await m.reply('❌ *Profile Not Found*\nThis user is not registered yet!')
            }
            
            const stats = await User.getStats(targetJid)
            const levelInfo = await User.getLevelInfo(targetJid)
            const isOwnProfile = targetJid === m.sender
            
            // Create progress bar for level
            const progressBar = createProgressBar(levelInfo.progress)
            
            // Premium status indicator
            const premiumStatus = stats.premium.isActive ? '🟢 Active' : '🔴 Inactive'
            const planName = stats.premium.planName
            
            // Usage statistics
            const commandUsage = stats.usage.today.commands || 0
            const messageUsage = stats.usage.today.messages || 0
            const commandLimit = stats.usage.limits.dailyCommands
            const messageLimit = stats.usage.limits.dailyMessages
            
            const profileMsg = `👤 *User Profile*

📱 *Name:* ${stats.user.name}
📞 *Number:* ${stats.user.number}
📅 *Join Date:* ${new Date(stats.user.joinDate).toLocaleDateString('id-ID')}
🕒 *Last Seen:* ${new Date(stats.user.lastSeen).toLocaleString('id-ID')}

🎯 *Level & Experience*
🏆 *Level:* ${levelInfo.level}
⭐ *Experience:* ${levelInfo.experience.toLocaleString()} XP
📊 *Progress:* ${progressBar} (${levelInfo.progress.toFixed(1)}%)
🎯 *Next Level:* ${levelInfo.xpNeeded} XP needed

💎 *Premium Status*
📦 *Plan:* ${planName}
🔋 *Status:* ${premiumStatus}
${stats.premium.expiry ? `⏰ *Expires:* ${new Date(stats.premium.expiry).toLocaleDateString('id-ID')}` : ''}

📊 *Today's Usage*
⚡ *Commands:* ${commandUsage}/${commandLimit} (${((commandUsage/commandLimit)*100).toFixed(1)}%)
💬 *Messages:* ${messageUsage}/${messageLimit} (${((messageUsage/messageLimit)*100).toFixed(1)}%)

🏆 *Achievements:* ${stats.achievements} unlocked
⚠️ *Warnings:* ${stats.warnings}/3
${stats.banned ? '🚫 *Status:* Banned' : '✅ *Status:* Active'}

${isOwnProfile ? `\n💡 *Quick Actions:*
• \`!bio <text>\` - Set your bio
• \`!level\` - View detailed level info
• \`!premium\` - View premium plans
• \`!achievements\` - View achievements` : ''}`

            await m.reply(profileMsg)
            
        } catch (error) {
            console.error('Profile error:', error)
            await m.reply('❌ *Error*\nFailed to load profile. Please try again.')
        }
    }
}

function createProgressBar(percentage) {
    const filled = Math.round(percentage / 10)
    const empty = 10 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

export default handler