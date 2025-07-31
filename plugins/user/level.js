import User from '../../database/models/User.js'
import { XP_CONFIG } from '../../database/models/User.js'

export const handler = {
    command: ['level', 'xp', 'exp', 'rank'],
    tags: ['user'],
    help: 'View your level and experience details',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            const targetJid = m.mentionedJid?.[0] || m.sender
            const user = await User.getById(targetJid)
            
            if (!user.registered) {
                return await m.reply('❌ *Level Not Found*\nThis user is not registered yet!')
            }
            
            const levelInfo = await User.getLevelInfo(targetJid)
            const isOwnLevel = targetJid === m.sender
            
            // Create detailed progress bar
            const progressBar = createDetailedProgressBar(levelInfo.progress)
            
            // Calculate XP rates
            const messageXP = XP_CONFIG.messageXP
            const commandXP = XP_CONFIG.commandXP
            const dailyBonus = XP_CONFIG.dailyBonus
            
            // Level rewards info
            const levelRewards = getLevelRewards(levelInfo.level)
            
            const levelMsg = `🎯 *Level Information*

👤 *User:* ${user.name}
🏆 *Current Level:* ${levelInfo.level}
⭐ *Total Experience:* ${levelInfo.experience.toLocaleString()} XP

📊 *Progress to Next Level*
${progressBar}
*Progress:* ${levelInfo.progress.toFixed(1)}%
*XP Needed:* ${levelInfo.xpNeeded} XP

📈 *Experience Breakdown*
• *Current Level XP:* ${levelInfo.currentLevelXP.toLocaleString()} XP
• *Next Level XP:* ${levelInfo.nextLevelXP.toLocaleString()} XP
• *XP in Current Level:* ${(levelInfo.experience - levelInfo.currentLevelXP).toLocaleString()} XP

⚡ *XP Rates*
• *Per Message:* +${messageXP} XP
• *Per Command:* +${commandXP} XP
• *Daily Bonus:* +${dailyBonus} XP
• *Level Up Bonus:* +${levelInfo.level * 10} XP

🎁 *Level ${levelInfo.level} Rewards*
${levelRewards}

${isOwnLevel ? `💡 *Tips to Level Up:*
• Send messages to earn XP
• Use commands to earn more XP
• Complete daily activities
• Achieve milestones for bonus XP

📋 *Quick Commands:*
• \`!profile\` - View full profile
• \`!leaderboard\` - View top users
• \`!achievements\` - View achievements` : ''}`

            await m.reply(levelMsg)
            
        } catch (error) {
            console.error('Level error:', error)
            await m.reply('❌ *Error*\nFailed to load level information. Please try again.')
        }
    }
}

function createDetailedProgressBar(percentage) {
    const filled = Math.round(percentage / 5) // 20 segments
    const empty = 20 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

function getLevelRewards(level) {
    const rewards = []
    
    if (level >= 5) rewards.push('• Unlock custom bio')
    if (level >= 10) rewards.push('• Priority support')
    if (level >= 20) rewards.push('• Exclusive commands')
    if (level >= 30) rewards.push('• VIP features')
    if (level >= 50) rewards.push('• Admin privileges')
    
    if (rewards.length === 0) {
        rewards.push('• Basic features')
    }
    
    return rewards.join('\n')
}

export default handler