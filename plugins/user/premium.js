import User from '../../database/models/User.js'
import { PREMIUM_PLANS } from '../../database/models/User.js'

export default {
  name: 'premium',
  alias: ['vip', 'plan', 'upgrade'],
  category: 'user',
  desc: 'View premium plans and features',
  use: '[plan_name]',
  async exec({ sock, m, args, prefix }) {
    try {
      const jid = m.sender
      const user = await User.getById(jid)
      
      if (!user.registered) {
        return await m.reply('❌ *Premium Failed*\nYou must register first!\n\nUse: ' + prefix + 'register <name>')
      }
      
      // If specific plan is requested
      if (args.length > 0) {
        const planName = args[0].toUpperCase()
        const plan = PREMIUM_PLANS[planName]
        
        if (!plan) {
          return await m.reply('❌ *Invalid Plan*\nAvailable plans: FREE, BASIC, PREMIUM, VIP')
        }
        
        const planMsg = `💎 *${plan.name} Plan Details*

💰 *Price:* ${plan.price === 0 ? 'Free' : `Rp ${plan.price.toLocaleString()}`}
📊 *Daily Limit:* ${plan.dailyLimit} commands
🏆 *Level:* ${plan.level}

✨ *Features:*
${plan.features.map(feature => `• ${formatFeature(feature)}`).join('\n')}

${user.premiumPlan === planName ? '✅ *Current Plan*' : user.premiumPlan !== 'FREE' ? '🔄 *Upgrade Available*' : '💡 *Upgrade Available*'}`

        return await m.reply(planMsg)
      }
      
      // Show all plans
      const currentPlan = PREMIUM_PLANS[user.premiumPlan]
      const premiumStatus = await User.checkPremiumStatus(jid)
      
      const plansMsg = `💎 *Premium Plans*

${Object.entries(PREMIUM_PLANS).map(([key, plan]) => {
  const isCurrent = user.premiumPlan === key
  const status = isCurrent ? '✅ Current' : user.premiumPlan !== 'FREE' && plan.level > currentPlan.level ? '🔄 Upgrade' : '💡 Available'
  
  return `${status} *${plan.name}*
💰 Price: ${plan.price === 0 ? 'Free' : `Rp ${plan.price.toLocaleString()}`}
📊 Daily Limit: ${plan.dailyLimit} commands
🏆 Level: ${plan.level}
✨ Features: ${plan.features.length} features`
}).join('\n\n')}

📊 *Your Current Status:*
• *Plan:* ${currentPlan.name}
• *Status:* ${premiumStatus ? '🟢 Active' : '🔴 Inactive'}
${user.premiumExpiry ? `• *Expires:* ${new Date(user.premiumExpiry).toLocaleDateString('id-ID')}` : ''}

💡 *To view plan details:*
${prefix}premium <plan_name>

💡 *To upgrade:*
Contact admin for premium upgrade

📋 *Quick Commands:*
• \`${prefix}profile\` - View your profile
• \`${prefix}usage\` - Check daily usage
• \`${prefix}features\` - View available features`

      await m.reply(plansMsg)
      
    } catch (error) {
      console.error('Premium error:', error)
      await m.reply('❌ *Error*\nFailed to load premium information. Please try again.')
    }
  }
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