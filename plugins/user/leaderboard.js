import User from '../../database/models/User.js'

export const handler = {
    command: ['leaderboard', 'top', 'rankings', 'lb'],
    tags: ['user'],
    help: 'View top users leaderboard',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            const limit = args ? parseInt(args) : 10
            
            if (limit > 20) {
                return await m.reply('❌ *Invalid Limit*\nMaximum 20 users can be shown at once.')
            }
            
            const topUsers = await User.getTopUsers(limit)
            
            if (topUsers.length === 0) {
                return await m.reply('❌ *No Users Found*\nNo registered users found.')
            }
            
            // Find current user's rank
            const currentUser = await User.getById(m.sender)
            let userRank = 'Not ranked'
            if (currentUser.registered) {
                const allUsers = await User.getTopUsers(1000) // Get all users for ranking
                const userIndex = allUsers.findIndex(user => user.name === currentUser.name)
                if (userIndex !== -1) {
                    userRank = `#${userIndex + 1}`
                }
            }
            
            const leaderboardMsg = `🏆 *Top Users Leaderboard*

${topUsers.map((user, index) => {
    const rank = index + 1
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`
    const planIcon = user.premiumPlan !== 'FREE' ? '💎' : '👤'
    
    return `${medal} ${planIcon} *${user.name}*
🏆 Level: ${user.level} | ⭐ XP: ${user.experience.toLocaleString()} | 📦 ${user.premiumPlan}`
}).join('\n\n')}

${currentUser.registered ? `\n👤 *Your Rank:* ${userRank}` : ''}

💡 *To improve your rank:*
• Send messages to earn XP
• Use commands to earn more XP
• Complete daily activities
• Upgrade to premium for bonus features

📋 *Quick Commands:*
• \`!profile\` - View your profile
• \`!level\` - View level details
• \`!register\` - Register if not registered`

            await m.reply(leaderboardMsg)
            
        } catch (error) {
            console.error('Leaderboard error:', error)
            await m.reply('❌ *Error*\nFailed to load leaderboard. Please try again.')
        }
    }
}

export default handler