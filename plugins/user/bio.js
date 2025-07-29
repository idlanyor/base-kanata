import User from '../../database/models/User.js'
import { PREMIUM_PLANS } from '../../database/models/User.js'

export default {
  name: 'bio',
  alias: ['setbio', 'biodata'],
  category: 'user',
  desc: 'Set or view your bio',
  use: '[text]',
  async exec({ sock, m, args, prefix }) {
    try {
      const jid = m.sender
      const user = await User.getById(jid)
      
      if (!user.registered) {
        return await m.reply('❌ *Bio Failed*\nYou must register first!\n\nUse: ' + prefix + 'register <name>')
      }
      
      // If no args provided, show current bio
      if (!args.length) {
        const bio = await User.getBio(jid)
        const plan = PREMIUM_PLANS[user.premiumPlan]
        const maxLength = plan.level >= 1 ? 'Unlimited' : '50 characters'
        
        const bioMsg = `📝 *Your Bio*
        
${bio === 'No bio set' ? 'No bio set yet' : bio}

📊 *Bio Info:*
• *Plan:* ${plan.name}
• *Max Length:* ${maxLength}
• *Current Length:* ${bio.length} characters

💡 *To set bio:*
${prefix}bio <your bio text>`

        return await m.reply(bioMsg)
      }
      
      // Set new bio
      const newBio = args.join(' ')
      const plan = PREMIUM_PLANS[user.premiumPlan]
      
      // Check length limit for free users
      if (plan.level < 1 && newBio.length > 50) {
        return await m.reply(`❌ *Bio Too Long*\nYour bio is ${newBio.length} characters long, but the limit is 50 characters for Free plan.\n\n💎 *Upgrade to Basic plan* to remove this limit!`)
      }
      
      // Check for inappropriate content
      const inappropriateWords = ['spam', 'scam', 'virus', 'hack', 'crack']
      const hasInappropriate = inappropriateWords.some(word => 
        newBio.toLowerCase().includes(word)
      )
      
      if (hasInappropriate) {
        return await m.reply('❌ *Bio Rejected*\nYour bio contains inappropriate content. Please use appropriate language.')
      }
      
      await User.setBio(jid, newBio)
      
      const successMsg = `✅ *Bio Updated Successfully!*
      
📝 *New Bio:*
${newBio}

📊 *Bio Info:*
• *Length:* ${newBio.length} characters
• *Plan:* ${plan.name}
• *Max Length:* ${plan.level >= 1 ? 'Unlimited' : '50 characters'}

💡 *To view your bio:*
${prefix}bio`

      await m.reply(successMsg)
      
    } catch (error) {
      console.error('Bio error:', error)
      if (error.message.includes('Custom bio requires')) {
        await m.reply('❌ *Premium Required*\nCustom bio requires Basic plan or higher. Upgrade to premium to use this feature!')
      } else {
        await m.reply('❌ *Error*\nFailed to update bio. Please try again.')
      }
    }
  }
}