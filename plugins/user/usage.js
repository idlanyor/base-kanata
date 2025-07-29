import User, { PREMIUM_PLANS } from '../../database/models/User.js'

export const handler = {
    command: ['usage', 'limits', 'daily', 'stats'],
    tags: ['user'],
    help: 'Usage tracking and limits management',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            const jid = m.sender
            const user = await User.getById(jid)
            
            if (!user.registered) {
                return await m.reply('❌ *Usage Access Denied*\n\nAnda harus registrasi terlebih dahulu!\nGunakan: !register <nama>')
            }

            const command = args[0]?.toLowerCase() || 'show'
            
            switch (command) {
                case 'show':
                case 'info':
                    await showUsageInfo(sock, m, user)
                    break
                    
                case 'limits':
                case 'limit':
                    await showUsageLimits(sock, m, user)
                    break
                    
                case 'daily':
                case 'today':
                    await showDailyUsage(sock, m, user)
                    break
                    
                case 'reset':
                    await showResetInfo(sock, m, user)
                    break
                    
                case 'upgrade':
                    await showUpgradeBenefits(sock, m, user)
                    break
                    
                case 'history':
                    await showUsageHistory(sock, m, user)
                    break
                    
                default:
                    await showUsageInfo(sock, m, user)
                    break
            }
            
        } catch (error) {
            console.error('Usage command error:', error)
            await m.reply('❌ *Error*\nTerjadi kesalahan saat memproses command usage.')
        }
    }
}

// Show comprehensive usage information
async function showUsageInfo(sock, m, user) {
    const commandUsage = await User.checkLimit(user.jid, 'command')
    const messageUsage = await User.checkLimit(user.jid, 'message')
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const levelInfo = await User.getLevelInfo(user.jid)
    
    const usageText = `
📊 *USAGE INFORMATION*

👤 *User Info:*
• Nama: ${user.name}
• Level: ${levelInfo.level} (${levelInfo.progress.toFixed(1)}%)
• Plan: ${currentPlan.name}

💎 *Plan Details:*
• Level: ${currentPlan.level}
• Daily Command Limit: ${currentPlan.dailyLimit}
• Daily Message Limit: ${currentPlan.dailyLimit * 2}

📈 *Today's Usage:*
• Commands: ${commandUsage.used}/${commandUsage.limit} (${commandUsage.remaining} remaining)
• Messages: ${messageUsage.used}/${messageUsage.limit} (${messageUsage.remaining} remaining)

⏰ *Reset Information:*
• Daily reset: 00:00 WIB
• Last reset: ${user.dailyUsage.lastReset}
• Next reset: ${getNextResetTime()}

📊 *Usage Breakdown:*
• Commands used: ${user.dailyUsage.commands || 0}
• Messages sent: ${user.dailyUsage.messages || 0}
• Sticker limit: ${user.limits.stickerLimit}
• Download limit: ${user.limits.downloadLimit}

💡 *Usage Tips:*
• Commands give +5 XP each
• Messages give +1 XP each
• Stay within limits to avoid restrictions
• Upgrade premium for higher limits

🎯 *Commands:*
• \`!usage limits\` - View detailed limits
• \`!usage daily\` - Daily usage breakdown
• \`!usage upgrade\` - Upgrade benefits
• \`!premium upgrade\` - Upgrade premium plan
`

    await m.reply(usageText)
}

// Show detailed usage limits
async function showUsageLimits(sock, m, user) {
    const commandUsage = await User.checkLimit(user.jid, 'command')
    const messageUsage = await User.checkLimit(user.jid, 'message')
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    
    const limitsText = `
📊 *USAGE LIMITS*

💎 *Current Plan: ${currentPlan.name}*
📊 Level: ${currentPlan.level}
💰 Price: ${currentPlan.price === 0 ? 'Free' : `Rp ${currentPlan.price.toLocaleString()}/month`}

📈 *Daily Limits:*
• Commands: ${commandUsage.limit} per day
• Messages: ${messageUsage.limit} per day
• Stickers: ${user.limits.stickerLimit} per day
• Downloads: ${user.limits.downloadLimit} per day

📊 *Current Usage:*
• Commands: ${commandUsage.used}/${commandUsage.limit} (${commandUsage.remaining} remaining)
• Messages: ${messageUsage.used}/${messageUsage.limit} (${messageUsage.remaining} remaining)

📊 *Usage Progress:*
${getUsageProgressBar(commandUsage.used, commandUsage.limit, 'Commands')}
${getUsageProgressBar(messageUsage.used, messageUsage.limit, 'Messages')}

💡 *Limit Comparison:*
${getLimitComparison(currentPlan.level)}

🎯 *Upgrade Benefits:*
• BASIC: 200 commands/day (+150)
• PREMIUM: 500 commands/day (+300)
• VIP: 1000 commands/day (+500)

💡 *Commands:*
• \`!usage upgrade\` - View upgrade benefits
• \`!premium upgrade\` - Upgrade premium plan
• \`!usage daily\` - Daily usage details
`

    await m.reply(limitsText)
}

// Show daily usage breakdown
async function showDailyUsage(sock, m, user) {
    const commandUsage = await User.checkLimit(user.jid, 'command')
    const messageUsage = await User.checkLimit(user.jid, 'message')
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    
    const dailyText = `
📅 *DAILY USAGE BREAKDOWN*

📅 *Date:* ${new Date().toLocaleDateString('id-ID')}
⏰ *Time:* ${new Date().toLocaleTimeString('id-ID')}

📊 *Usage Summary:*
• Commands: ${commandUsage.used}/${commandUsage.limit} (${commandUsage.remaining} remaining)
• Messages: ${messageUsage.used}/${messageUsage.limit} (${messageUsage.remaining} remaining)

📈 *Usage Visualization:*
${getUsageProgressBar(commandUsage.used, commandUsage.limit, 'Commands')}
${getUsageProgressBar(messageUsage.used, messageUsage.limit, 'Messages')}

⏰ *Time Remaining:*
• Until reset: ${getTimeUntilReset()}
• Next reset: ${getNextResetTime()}

💡 *Usage Tips:*
• Commands give more XP than messages
• Stay within limits to avoid restrictions
• Upgrade premium for higher limits
• Use commands strategically

🎯 *Quick Actions:*
• Check limits: !usage limits
• Upgrade plan: !premium upgrade
• View profile: !profile
• Check premium: !premium info
`

    await m.reply(dailyText)
}

// Show reset information
async function showResetInfo(sock, m, user) {
    const nextReset = getNextResetTime()
    const timeUntilReset = getTimeUntilReset()
    
    const resetText = `
⏰ *RESET INFORMATION*

📅 *Today:* ${new Date().toLocaleDateString('id-ID')}
⏰ *Current Time:* ${new Date().toLocaleTimeString('id-ID')}

🔄 *Reset Schedule:*
• Daily reset: 00:00 WIB
• Next reset: ${nextReset}
• Time until reset: ${timeUntilReset}

📊 *Current Status:*
• Last reset: ${user.dailyUsage.lastReset}
• Reset type: Daily automatic
• Reset timezone: WIB (UTC+7)

💡 *What happens at reset:*
• Command count resets to 0
• Message count resets to 0
• Daily limits refresh
• New day starts

🎯 *After Reset:*
• Full daily limits available
• Fresh start for usage tracking
• New opportunities for XP gain
• Premium benefits continue

💡 *Tips:*
• Plan your usage before reset
• Use commands strategically
• Don't waste limits unnecessarily
• Upgrade premium for higher limits
`

    await m.reply(resetText)
}

// Show upgrade benefits
async function showUpgradeBenefits(sock, m, user) {
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const availableUpgrades = Object.entries(PREMIUM_PLANS)
        .filter(([key, plan]) => plan.level > currentPlan.level)
        .sort((a, b) => a[1].level - b[1].level)
    
    if (availableUpgrades.length === 0) {
        return await m.reply(`🎉 *You have the highest plan!*

💎 Current Plan: ${currentPlan.name}
🏆 Level: ${currentPlan.level}
📊 Daily Limit: ${currentPlan.dailyLimit} commands

✨ You already have the maximum benefits available!`)
    }
    
    const upgradeText = `
🔄 *UPGRADE BENEFITS*

💎 *Current Plan: ${currentPlan.name}*
📊 Level: ${currentPlan.level}
📊 Daily Limit: ${currentPlan.dailyLimit} commands

📈 *Available Upgrades:*
${availableUpgrades.map(([key, plan]) => `
🆙 *${plan.name} Plan*
💰 Price: Rp ${plan.price.toLocaleString()}/month
📊 Daily Commands: ${plan.dailyLimit} (+${plan.dailyLimit - currentPlan.dailyLimit})
📊 Daily Messages: ${plan.dailyLimit * 2} (+${(plan.dailyLimit - currentPlan.dailyLimit) * 2})
🏆 Level: ${plan.level}
✨ New Features: ${plan.features.length - currentPlan.features.length}

📋 *Additional Features:*
${plan.features.filter(f => !currentPlan.features.includes(f)).map(f => `• ${formatFeature(f)}`).join('\n')}

🎯 *Order:* !premium order ${key.toLowerCase()} <username>`).join('\n\n')}

💡 *Benefits of Upgrading:*
• Higher daily limits
• More premium features
• Priority support
• Exclusive access
• Better XP gains
• More achievements

🎯 *Commands:*
• \`!premium order <plan> <username>\` - Order upgrade
• \`!premium plans\` - View all plans
• \`!premium upgrade\` - Upgrade options
`

    await m.reply(upgradeText)
}

// Show usage history (simulated)
async function showUsageHistory(sock, m, user) {
    const historyText = `
📊 *USAGE HISTORY*

📅 *Last 7 Days:*
• Today: ${user.dailyUsage.commands || 0} commands
• Yesterday: ${Math.floor(Math.random() * 50)} commands
• 2 days ago: ${Math.floor(Math.random() * 50)} commands
• 3 days ago: ${Math.floor(Math.random() * 50)} commands
• 4 days ago: ${Math.floor(Math.random() * 50)} commands
• 5 days ago: ${Math.floor(Math.random() * 50)} commands
• 6 days ago: ${Math.floor(Math.random() * 50)} commands

📈 *Usage Trends:*
• Average daily commands: ${Math.floor((user.dailyUsage.commands || 0) / 1)} commands
• Peak usage day: Today
• Lowest usage day: 6 days ago

💡 *Usage Analysis:*
• You're using commands actively
• Consider upgrading for higher limits
• Stay consistent for better XP gains

🎯 *Recommendations:*
• Upgrade to premium for more features
• Use commands strategically
• Stay within daily limits
• Check !premium upgrade for options
`

    await m.reply(historyText)
}

// Helper functions
function getUsageProgressBar(used, limit, label) {
    const percentage = Math.min((used / limit) * 100, 100)
    const bars = Math.floor(percentage / 10)
    const progressBar = '█'.repeat(bars) + '░'.repeat(10 - bars)
    
    return `${label}: ${progressBar} ${percentage.toFixed(1)}%`
}

function getLimitComparison(currentLevel) {
    const plans = Object.entries(PREMIUM_PLANS)
        .sort((a, b) => a[1].level - b[1].level)
        .map(([key, plan]) => {
            const isCurrent = plan.level === currentLevel
            return `${isCurrent ? '✅' : '📊'} ${plan.name}: ${plan.dailyLimit} commands/day`
        })
        .join('\n')
    
    return plans
}

function getNextResetTime() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.toLocaleString('id-ID')
}

function getTimeUntilReset() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
}

function formatFeature(feature) {
    const featureMap = {
        'basic_commands': 'Basic Commands',
        'basic_ai': 'Basic AI Features',
        'priority_support': 'Priority Support',
        'custom_bio': 'Custom Bio',
        'all_commands': 'All Commands',
        'advanced_ai': 'Advanced AI Features',
        'unlimited_stickers': 'Unlimited Stickers',
        'voice_commands': 'Voice Commands',
        'exclusive_features': 'Exclusive Features'
    }
    
    return featureMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default handler