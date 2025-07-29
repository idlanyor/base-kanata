import User from '../../database/models/User.js'

// Achievement definitions
const ACHIEVEMENTS = {
    'first_register': {
        name: 'First Steps',
        description: 'Register with the bot',
        icon: '🎉',
        xp: 50
    },
    'level_10': {
        name: 'Rising Star',
        description: 'Reach level 10',
        icon: '⭐',
        xp: 100
    },
    'level_20': {
        name: 'Experienced',
        description: 'Reach level 20',
        icon: '🌟',
        xp: 200
    },
    'level_30': {
        name: 'Veteran',
        description: 'Reach level 30',
        icon: '🏆',
        xp: 300
    },
    'level_50': {
        name: 'Legend',
        description: 'Reach level 50',
        icon: '👑',
        xp: 500
    },
    'premium_user': {
        name: 'Premium Member',
        description: 'Upgrade to any premium plan',
        icon: '💎',
        xp: 150
    },
    'daily_streak_7': {
        name: 'Week Warrior',
        description: 'Use bot for 7 consecutive days',
        icon: '📅',
        xp: 100
    },
    'command_master': {
        name: 'Command Master',
        description: 'Use 100 commands in a day',
        icon: '⚡',
        xp: 200
    },
    'social_butterfly': {
        name: 'Social Butterfly',
        description: 'Send 500 messages in a day',
        icon: '🦋',
        xp: 150
    }
}

export const handler = {
    command: ['achievements', 'achievement', 'badges', 'trophy'],
    tags: ['user'],
    help: 'View your achievements and badges',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            const jid = m.sender
            const user = await User.getById(jid)
            
            if (!user.registered) {
                return await m.reply('❌ *Achievements Failed*\nYou must register first!\n\nUse: !register <name>')
            }
            
            const userAchievements = await User.getAchievements(jid)
            const totalAchievements = Object.keys(ACHIEVEMENTS).length
            const unlockedCount = userAchievements.length
            const progress = ((unlockedCount / totalAchievements) * 100).toFixed(1)
            
            // Get unlocked and locked achievements
            const unlocked = userAchievements.map(id => ({
                id,
                ...ACHIEVEMENTS[id],
                unlocked: true
            }))
            
            const locked = Object.entries(ACHIEVEMENTS)
                .filter(([id]) => !userAchievements.includes(id))
                .map(([id, achievement]) => ({
                    id,
                    ...achievement,
                    unlocked: false
                }))
            
            const achievementsMsg = `🏆 *Achievements & Badges*

📊 *Progress:* ${unlockedCount}/${totalAchievements} (${progress}%)
⭐ *Total XP from Achievements:* ${unlocked.reduce((sum, a) => sum + a.xp, 0)} XP

${unlocked.length > 0 ? `\n✅ *Unlocked Achievements:*
${unlocked.map(achievement => 
    `${achievement.icon} *${achievement.name}*
    📝 ${achievement.description}
    ⭐ +${achievement.xp} XP`
).join('\n\n')}` : ''}

${locked.length > 0 ? `\n🔒 *Locked Achievements:*
${locked.slice(0, 5).map(achievement => 
    `${achievement.icon} *${achievement.name}*
    📝 ${achievement.description}
    ⭐ +${achievement.xp} XP`
).join('\n\n')}${locked.length > 5 ? `\n... and ${locked.length - 5} more` : ''}` : ''}

💡 *How to unlock achievements:*
• Register and use the bot daily
• Level up to unlock level-based achievements
• Upgrade to premium for premium achievements
• Use commands and send messages actively
• Complete daily activities

📋 *Quick Commands:*
• \`!profile\` - View your profile
• \`!level\` - View level details
• \`!leaderboard\` - View rankings`

            await m.reply(achievementsMsg)
            
        } catch (error) {
            console.error('Achievements error:', error)
            await m.reply('❌ *Error*\nFailed to load achievements. Please try again.')
        }
    }
}

export default handler