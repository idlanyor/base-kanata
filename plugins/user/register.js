import User from '../../database/models/User.js'
import { XP_CONFIG } from '../../database/models/User.js'

export const handler = {
    command: ['register', 'daftar', 'reg'],
    tags: ['user'],
    help: 'Register yourself with the bot',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            const jid = m.sender
            const user = await User.getById(jid)
            
            if (user.registered) {
                return await m.reply('❌ *Registration Failed*\nYou are already registered!')
            }
            
            const name = args
            if (!name) {
                return await m.reply('❌ *Registration Failed*\nPlease provide your name!\n\nExample: !register John Doe')
            }
            
            if (name.length < 2 || name.length > 30) {
                return await m.reply('❌ *Registration Failed*\nName must be between 2-30 characters!')
            }
            
            const registeredUser = await User.register(jid, { name })
            
            const welcomeMsg = `🎉 *Registration Successful!*
            
👤 *Name:* ${registeredUser.name}
📱 *Number:* ${registeredUser.number}
📅 *Join Date:* ${new Date(registeredUser.joinDate).toLocaleDateString('id-ID')}
⭐ *Initial XP:* +100 XP

🎯 *Next Steps:*
• Use \`!profile\` to view your profile
• Use \`!bio\` to set your bio
• Use \`!help\` to see available commands

Welcome to the community! 🚀`

            await m.reply(welcomeMsg)
            
        } catch (error) {
            console.error('Registration error:', error)
            await m.reply('❌ *Registration Failed*\nAn error occurred during registration. Please try again.')
        }
    }
}

export default handler