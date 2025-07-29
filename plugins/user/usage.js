import User from '../../database/models/User.js'
import { PREMIUM_PLANS } from '../../database/models/User.js'

export default {
  name: 'usage',
  alias: ['limit', 'quota', 'daily'],
  category: 'user',
  desc: 'Check your daily usage and limits',
  use: '',
  async exec({ sock, m, args, prefix }) {
    try {
      const jid = m.sender
      const user = await User.getById(jid)
      
      if (!user.registered) {
        return await m.reply('❌ *Usage Failed*\nYou must register first!\n\nUse: ' + prefix + 'register <name>')
      }
      
      const commandLimit = await User.checkLimit(jid, 'command')
      const messageLimit = await User.checkLimit(jid, 'message')
      const plan = PREMIUM_PLANS[user.premiumPlan]
      
      // Create progress bars
      const commandBar = createUsageBar(commandLimit.used, commandLimit.limit)
      const messageBar = createUsageBar(messageLimit.used, messageLimit.limit)
      
      // Calculate usage percentages
      const commandPercent = ((commandLimit.used / commandLimit.limit) * 100).toFixed(1)
      const messagePercent = ((messageLimit.used / messageLimit.limit) * 100).toFixed(1)
      
      // Get remaining time until reset
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const timeUntilReset = tomorrow - now
      const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60))
      const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))
      
      const usageMsg = `📊 *Daily Usage Report*

👤 *User:* ${user.name}
📦 *Plan:* ${plan.name}
🕒 *Reset Time:* ${hoursUntilReset}h ${minutesUntilReset}m

⚡ *Command Usage*
${commandBar}
*Used:* ${commandLimit.used}/${commandLimit.limit} (${commandPercent}%)
*Remaining:* ${commandLimit.remaining} commands

💬 *Message Usage*
${messageBar}
*Used:* ${messageLimit.used}/${messageLimit.limit} (${messagePercent}%)
*Remaining:* ${messageLimit.remaining} messages

📈 *Other Limits*
• *Sticker Limit:* ${user.limits.stickerLimit}/day
• *Download Limit:* ${user.limits.downloadLimit}/day

${commandLimit.remaining <= 5 || messageLimit.remaining <= 10 ? `⚠️ *Warning:* You're running low on daily quota!

💎 *Upgrade to Premium* for higher limits:
• Basic: 200 commands/day
• Premium: 500 commands/day
• VIP: 1000 commands/day` : ''}

💡 *Tips:*
• Commands reset daily at 00:00
• Messages reset daily at 00:00
• Upgrade plan for higher limits
• Use commands wisely

📋 *Quick Commands:*
• \`${prefix}profile\` - View full profile
• \`${prefix}premium\` - View premium plans
• \`${prefix}level\` - View level info`

      await m.reply(usageMsg)
      
    } catch (error) {
      console.error('Usage error:', error)
      await m.reply('❌ *Error*\nFailed to load usage information. Please try again.')
    }
  }
}

function createUsageBar(used, limit) {
  const percentage = (used / limit) * 100
  const filled = Math.round(percentage / 5) // 20 segments
  const empty = 20 - filled
  
  let bar = ''
  if (percentage >= 90) {
    bar = '🔴' + '█'.repeat(filled - 1) + '░'.repeat(empty)
  } else if (percentage >= 75) {
    bar = '🟡' + '█'.repeat(filled - 1) + '░'.repeat(empty)
  } else {
    bar = '🟢' + '█'.repeat(filled) + '░'.repeat(empty)
  }
  
  return bar
}