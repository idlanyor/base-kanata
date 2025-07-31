import User from '../database/models/User.js'
import { XP_CONFIG } from '../database/models/User.js'

export async function userMiddleware(sock, m, next) {
  try {
    const jid = m.sender
    
    // Get or create user
    const user = await User.getById(jid)
    
    // Check if user is banned
    if (user.banned) {
      await m.reply(`🚫 *Access Denied*
      
You have been banned from using this bot.

📅 *Ban Date:* ${new Date(user.banDate).toLocaleDateString('id-ID')}
📝 *Reason:* ${user.banReason || 'No reason provided'}

Contact the bot owner if you believe this is an error.`)
      return
    }
    
    // Update last seen
    await User.update(jid, { lastSeen: new Date().toISOString() })
    
    // Add XP for message (if registered)
    if (user.registered && !m.isCommand) {
      await User.addExperience(jid, XP_CONFIG.messageXP)
    }
    
    // Track usage for commands
    if (m.isCommand && user.registered) {
      try {
        await User.incrementUsage(jid, 'command')
        await User.addExperience(jid, XP_CONFIG.commandXP)
      } catch (error) {
        if (error.message.includes('limit reached')) {
          await m.reply(`⚠️ *Daily Limit Reached*
          
You have reached your daily command limit.

📊 *Current Usage:*
• Commands: ${user.dailyUsage.commands}/${user.limits.dailyCommands}
• Messages: ${user.dailyUsage.messages}/${user.limits.dailyMessages}

💎 *Upgrade to Premium* for higher limits:
• Basic: 200 commands/day
• Premium: 500 commands/day
• VIP: 1000 commands/day

⏰ *Reset Time:* Daily at 00:00`)
          return
        }
      }
    }
    
    // Track message usage
    if (user.registered && !m.isCommand) {
      try {
        await User.incrementUsage(jid, 'message')
      } catch (error) {
        // Silently handle message limit errors
        console.log(`Message limit reached for user ${jid}`)
      }
    }
    
    // Add user to message context
    m.user = user
    
    // Continue to next middleware/command
    next()
    
  } catch (error) {
    console.error('User middleware error:', error)
    // Continue execution even if middleware fails
    next()
  }
}

// Helper function to check if user has required level
export async function requireLevel(level) {
  return async (sock, m, next) => {
    try {
      const user = await User.getById(m.sender)
      
      if (!user.registered) {
        await m.reply('❌ *Registration Required*\nYou must register first to use this command.\n\nUse: !register <name>')
        return
      }
      
      if (user.level < level) {
        await m.reply(`❌ *Level Required*\nThis command requires level ${level} or higher.\n\nYour level: ${user.level}\nXP needed: ${(level - user.level) * 100} XP`)
        return
      }
      
      next()
    } catch (error) {
      console.error('Level check error:', error)
      next()
    }
  }
}

// Helper function to check premium status
export async function requirePremium() {
  return async (sock, m, next) => {
    try {
      const user = await User.getById(m.sender)
      
      if (!user.registered) {
        await m.reply('❌ *Registration Required*\nYou must register first to use this command.\n\nUse: !register <name>')
        return
      }
      
      const isPremium = await User.checkPremiumStatus(m.sender)
      
      if (!isPremium) {
        await m.reply(`❌ *Premium Required*\nThis command requires a premium plan.
        
💎 *Available Plans:*
• Basic: Rp 50,000/month
• Premium: Rp 100,000/month
• VIP: Rp 200,000/month

Use \`!premium\` to view all plans.`)
        return
      }
      
      next()
    } catch (error) {
      console.error('Premium check error:', error)
      next()
    }
  }
}

// Helper function to add achievement
export async function addAchievement(jid, achievementId) {
  try {
    const added = await User.addAchievement(jid, achievementId)
    if (added) {
      console.log(`Achievement unlocked: ${achievementId} for user ${jid}`)
    }
    return added
  } catch (error) {
    console.error('Error adding achievement:', error)
    return false
  }
}