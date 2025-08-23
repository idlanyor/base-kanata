import User from '../database/models/User.js'

export const handler = {
    command: ['useradmin', 'adminuser', 'usermod'],
    tags: ['owner'],
    help: 'Admin user management commands',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: true,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            // Check if user is owner
            if (!m.isOwner()) {
                return await m.reply('❌ *Access Denied*\nThis command is only for bot owners.')
            }
            
            if (!args) {
                return await m.reply(`❌ *Invalid Usage*\n\nUsage: !useradmin <command> [@user] [reason]\n\nCommands:\n• ban - Ban a user\n• unban - Unban a user\n• warn - Warn a user\n• search - Search users\n• info - Get user info`)
            }
            
            const command = args.split(' ')[0].toLowerCase()
            const targetJid = m.mentionedJid?.[0]
            const reason = args.split(' ').slice(1).join(' ')
            
            switch (command) {
                case 'ban':
                    if (!targetJid) {
                        return await m.reply('❌ *Invalid Usage*\nPlease mention a user to ban.\n\nUsage: !useradmin ban @user [reason]')
                    }
                    
                    if (targetJid === m.sender) {
                        return await m.reply('❌ *Cannot Ban Self*\nYou cannot ban yourself.')
                    }
                    
                    await User.banUser(targetJid, reason)
                    const targetUser = await User.getById(targetJid)
                    
                    await m.reply(`🚫 *User Banned Successfully*
                    
👤 *User:* ${targetUser.name}
📱 *Number:* ${targetUser.number}
📅 *Ban Date:* ${new Date().toLocaleDateString('id-ID')}
📝 *Reason:* ${reason || 'No reason provided'}

The user has been banned from using the bot.`)
                    break
                    
                case 'unban':
                    if (!targetJid) {
                        return await m.reply('❌ *Invalid Usage*\nPlease mention a user to unban.\n\nUsage: !useradmin unban @user')
                    }
                    
                    await User.unbanUser(targetJid)
                    const unbannedUser = await User.getById(targetJid)
                    
                    await m.reply(`✅ *User Unbanned Successfully*
                    
👤 *User:* ${unbannedUser.name}
📱 *Number:* ${unbannedUser.number}
📅 *Unban Date:* ${new Date().toLocaleDateString('id-ID')}

The user can now use the bot again.`)
                    break
                    
                case 'warn':
                    if (!targetJid) {
                        return await m.reply('❌ *Invalid Usage*\nPlease mention a user to warn.\n\nUsage: !useradmin warn @user [reason]')
                    }
                    
                    if (targetJid === m.sender) {
                        return await m.reply('❌ *Cannot Warn Self*\nYou cannot warn yourself.')
                    }
                    
                    const warnedUser = await User.addWarning(targetJid, reason)
                    
                    await m.reply(`⚠️ *User Warned Successfully*
                    
👤 *User:* ${warnedUser.name}
📱 *Number:* ${warnedUser.number}
⚠️ *Warnings:* ${warnedUser.warnings}/3
📝 *Reason:* ${reason || 'No reason provided'}

${warnedUser.warnings >= 3 ? '🚫 *User has been auto-banned due to 3 warnings!*' : '⚠️ *User will be auto-banned after 3 warnings.*'}`)
                    break
                    
                case 'search':
                    if (!args.split(' ')[1]) {
                        return await m.reply('❌ *Invalid Usage*\nPlease provide a search query.\n\nUsage: !useradmin search <query>')
                    }
                    
                    const query = args.split(' ').slice(1).join(' ')
                    const searchResults = await User.searchUsers(query)
                    
                    if (searchResults.length === 0) {
                        return await m.reply('❌ *No Users Found*\nNo users match your search query.')
                    }
                    
                    const searchMsg = `🔍 *Search Results for "${query}"*
                    
${searchResults.slice(0, 10).map((user, index) => 
    `${index + 1}. *${user.name}*
    📱 ${user.number}
    📅 Joined: ${new Date(user.joinDate).toLocaleDateString('id-ID')}
    🏆 Level: ${user.level}
    📦 Plan: ${user.premiumPlan}
    ${user.banned ? '🚫 Banned' : '✅ Active'}`
).join('\n\n')}

${searchResults.length > 10 ? `\n... and ${searchResults.length - 10} more results` : ''}`
                    
                    await m.reply(searchMsg)
                    break
                    
                case 'info':
                    if (!targetJid) {
                        return await m.reply('❌ *Invalid Usage*\nPlease mention a user to get info.\n\nUsage: !useradmin info @user')
                    }
                    
                    const userInfo = await User.getById(targetJid)
                    const userStats = await User.getStats(targetJid)
                    
                    const infoMsg = `👤 *User Information*
                    
📱 *Name:* ${userInfo.name}
📞 *Number:* ${userInfo.number}
📅 *Join Date:* ${new Date(userInfo.joinDate).toLocaleDateString('id-ID')}
🕒 *Last Seen:* ${new Date(userInfo.lastSeen).toLocaleString('id-ID')}

🎯 *Level & Experience*
🏆 *Level:* ${userStats.level.level}
⭐ *Experience:* ${userStats.level.experience.toLocaleString()} XP

💎 *Premium Status*
📦 *Plan:* ${userStats.premium.planName}
🔋 *Status:* ${userStats.premium.isActive ? '🟢 Active' : '🔴 Inactive'}
${userStats.premium.expiry ? `⏰ *Expires:* ${new Date(userStats.premium.expiry).toLocaleDateString('id-ID')}` : ''}

📊 *Usage Statistics*
⚡ *Commands Today:* ${userStats.usage.today.commands || 0}
💬 *Messages Today:* ${userStats.usage.today.messages || 0}
🏆 *Achievements:* ${userStats.achievements} unlocked
⚠️ *Warnings:* ${userStats.warnings}/3

📝 *Bio:* ${userInfo.bio || 'No bio set'}

${userInfo.banned ? `🚫 *Ban Information*
📅 *Ban Date:* ${new Date(userInfo.banDate).toLocaleDateString('id-ID')}
📝 *Ban Reason:* ${userInfo.banReason || 'No reason provided'}` : ''}`
                    
                    await m.reply(infoMsg)
                    break
                    
                default:
                    await m.reply(`❌ *Invalid Command*\n\nAvailable commands:\n• ban - Ban a user\n• unban - Unban a user\n• warn - Warn a user\n• search - Search users\n• info - Get user info\n\nUsage: !useradmin <command> [@user] [reason]`)
            }
            
        } catch (error) {
            console.error('User admin error:', error)
            await m.reply('❌ *Error*\nFailed to execute admin command. Please try again.')
        }
    }
}

export default handler