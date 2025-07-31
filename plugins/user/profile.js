import User, { PREMIUM_PLANS } from '../../database/models/User.js'

export const handler = {
    command: ['profile', 'me', 'bio', 'setbio'],
    tags: ['user'],
    help: 'User profile management and information',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            args = args.split(' ')
            const jid = m.sender
            const user = await User.getById(jid)
            
            if (!user.registered) {
                return await m.reply('❌ *Profile Access Denied*\n\nAnda harus registrasi terlebih dahulu!\nGunakan: !register <nama>')
            }

            const command = args[0]?.toLowerCase() || 'show'
            
            switch (command) {
                case 'show':
                case 'info':
                    await showUserProfile(sock, m, user)
                    break
                    
                case 'setbio':
                case 'bio':
                    await setUserBio(sock, m, args.slice(1).join(' '))
                    break
                    
                case 'edit':
                    await editUserProfile(sock, m, args.slice(1))
                    break
                    
                case 'stats':
                case 'statistics':
                    await showUserStatistics(sock, m, user)
                    break
                    
                case 'achievements':
                case 'achievement':
                    await showUserAchievements(sock, m, user)
                    break
                    
                case 'level':
                case 'xp':
                    await showUserLevel(sock, m, user)
                    break
                    
                default:
                    await showUserProfile(sock, m, user)
                    break
            }
            
        } catch (error) {
            console.error('Profile command error:', error)
            await m.reply('❌ *Error*\nTerjadi kesalahan saat memproses command profile.')
        }
    }
}

// Show comprehensive user profile
async function showUserProfile(sock, m, user) {
    const premiumStatus = await User.checkPremiumStatus(user.jid)
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const levelInfo = await User.getLevelInfo(user.jid)
    const stats = await User.getStats(user.jid)
    const achievements = await User.getAchievements(user.jid)
    
    const profileText = `
👤 *USER PROFILE*

📋 *Basic Info:*
• Nama: ${user.name}
• Number: ${user.number}
• Registered: ${user.registered ? '✅ Yes' : '❌ No'}
• Join Date: ${new Date(user.joinDate).toLocaleDateString('id-ID')}
• Last Seen: ${new Date(user.lastSeen).toLocaleString('id-ID')}

🏆 *Level & Experience:*
• Level: ${levelInfo.level}
• Experience: ${levelInfo.experience}/${levelInfo.nextLevelXP}
• Progress: ${levelInfo.progress.toFixed(1)}%
• XP Needed: ${levelInfo.xpNeeded}

💎 *Premium Status:*
• Plan: ${currentPlan.name}
• Status: ${premiumStatus ? '🟢 Active' : '🔴 Inactive'}
• Level: ${currentPlan.level}
• Daily Limit: ${currentPlan.dailyLimit} commands
${user.premiumExpiry ? `• Expires: ${new Date(user.premiumExpiry).toLocaleDateString('id-ID')}` : ''}

📊 *Usage Statistics:*
• Today Commands: ${stats.usage.today.commands || 0}/${stats.usage.limits.dailyCommands}
• Today Messages: ${stats.usage.today.messages || 0}/${stats.usage.limits.dailyMessages}
• Total Warnings: ${stats.warnings}/3
• Status: ${stats.banned ? '🚫 Banned' : '✅ Active'}

🏅 *Achievements:*
• Total: ${achievements.length} achievements
• Recent: ${achievements.slice(-3).map(a => formatAchievement(a)).join(', ')}

📝 *Bio:*
${user.bio || 'No bio set'}

💡 *Commands:*
• \`!profile setbio <text>\` - Set custom bio
• \`!profile stats\` - Detailed statistics
• \`!profile achievements\` - View achievements
• \`!profile level\` - Level information
• \`!premium info\` - Premium status
• \`!premium upgrade\` - Upgrade options
`

    await m.reply(profileText)
}

// Set user bio
async function setUserBio(sock, m, bioText) {
    if (!bioText || bioText.trim() === '') {
        return await m.reply(`❌ *Bio Empty!*

📝 *Cara penggunaan:*
!profile setbio <text>

📋 *Contoh:*
!profile setbio Saya adalah pengguna bot yang aktif!`)
    }

    try {
        const user = await User.getById(m.sender)
        const currentPlan = PREMIUM_PLANS[user.premiumPlan]
        
        // Check if user has premium plan for custom bio
        if (currentPlan.level < 1 && bioText.length > 50) {
            return await m.reply(`❌ *Bio Too Long!*

📝 Bio Anda: ${bioText.length} karakter
📊 Maksimal: 50 karakter (FREE plan)

💡 Upgrade ke BASIC plan untuk bio yang lebih panjang!
Gunakan: !premium upgrade`)
        }
        
        await User.setBio(m.sender, bioText)
        
        await m.reply(`✅ *Bio Updated Successfully!*

📝 *New Bio:*
${bioText}

💡 Bio Anda telah diperbarui.`)
        
    } catch (error) {
        console.error('Error setting bio:', error)
        await m.reply('❌ *Error*\nGagal memperbarui bio. Silakan coba lagi.')
    }
}

// Edit user profile
async function editUserProfile(sock, m, args) {
    if (args.length < 2) {
        return await m.reply(`❌ *Format Salah!*

📝 *Cara penggunaan:*
!profile edit <field> <value>

📋 *Contoh:*
!profile edit name John Doe
!profile edit bio My new bio

🎯 *Available fields:*
• name - Change display name
• bio - Set custom bio`)
    }

    const field = args[0].toLowerCase()
    const value = args.slice(1).join(' ')

    try {
        const user = await User.getById(m.sender)
        
        switch (field) {
            case 'name':
                await User.update(m.sender, { name: value })
                await m.reply(`✅ *Name Updated!*

👤 *New Name:* ${value}

💡 Nama Anda telah diperbarui.`)
                break
                
            case 'bio':
                await setUserBio(sock, m, value)
                break
                
            default:
                await m.reply(`❌ *Invalid Field!*

🎯 *Available fields:*
• name - Change display name
• bio - Set custom bio`)
                break
        }
        
    } catch (error) {
        console.error('Error editing profile:', error)
        await m.reply('❌ *Error*\nGagal memperbarui profile. Silakan coba lagi.')
    }
}

// Show detailed user statistics
async function showUserStatistics(sock, m, user) {
    const stats = await User.getStats(user.jid)
    const levelInfo = await User.getLevelInfo(user.jid)
    const premiumStatus = await User.checkPremiumStatus(user.jid)
    const commandUsage = await User.checkLimit(user.jid, 'command')
    const messageUsage = await User.checkLimit(user.jid, 'message')
    
    const statsText = `
📊 *USER STATISTICS*

👤 *Profile Info:*
• Nama: ${stats.user.name}
• Number: ${stats.user.number}
• Registered: ${stats.user.registered ? '✅ Yes' : '❌ No'}
• Join Date: ${new Date(stats.user.joinDate).toLocaleDateString('id-ID')}
• Last Seen: ${new Date(stats.user.lastSeen).toLocaleString('id-ID')}

🏆 *Level & Experience:*
• Level: ${levelInfo.level}
• Experience: ${levelInfo.experience}/${levelInfo.nextLevelXP}
• Progress: ${levelInfo.progress.toFixed(1)}%
• XP Needed: ${levelInfo.xpNeeded}

💎 *Premium Status:*
• Plan: ${stats.premium.planName}
• Status: ${premiumStatus ? '🟢 Active' : '🔴 Inactive'}
• Level: ${stats.premium.plan.level}
• Daily Limit: ${stats.premium.plan.dailyLimit} commands
${stats.premium.expiry ? `• Expires: ${new Date(stats.premium.expiry).toLocaleDateString('id-ID')}` : ''}

📈 *Usage Statistics:*
• Today Commands: ${commandUsage.used}/${commandUsage.limit} (${commandUsage.remaining} remaining)
• Today Messages: ${messageUsage.used}/${messageUsage.limit} (${messageUsage.remaining} remaining)
• Sticker Limit: ${stats.usage.limits.stickerLimit}
• Download Limit: ${stats.usage.limits.downloadLimit}

⚠️ *Warnings & Status:*
• Total Warnings: ${stats.warnings}/3
• Account Status: ${stats.banned ? '🚫 Banned' : '✅ Active'}

🏅 *Achievements:*
• Total Achievements: ${stats.achievements}

💡 *Tips:*
• Use commands to gain XP and level up
• Upgrade premium for higher limits
• Stay active to unlock achievements
`

    await m.reply(statsText)
}

// Show user achievements
async function showUserAchievements(sock, m, user) {
    const achievements = await User.getAchievements(user.jid)
    const levelInfo = await User.getLevelInfo(user.jid)
    
    if (achievements.length === 0) {
        return await m.reply(`🏅 *No Achievements Yet*

Anda belum memiliki achievements.
💡 Gunakan bot secara aktif untuk membuka achievements!

📊 *Current Progress:*
• Level: ${levelInfo.level}
• XP: ${levelInfo.experience}/${levelInfo.nextLevelXP}
• Progress: ${levelInfo.progress.toFixed(1)}%

🎯 *How to get achievements:*
• Use commands regularly
• Level up to milestone levels
• Upgrade to premium plans
• Stay active daily`)
    }
    
    const achievementsText = `
🏅 *USER ACHIEVEMENTS*

📊 *Total Achievements:* ${achievements.length}

🏆 *Your Achievements:*
${achievements.map((achievement, index) => {
    const achievementInfo = getAchievementInfo(achievement)
    return `${index + 1}. ${achievementInfo.icon} *${achievementInfo.name}*
   📝 ${achievementInfo.description}`
}).join('\n\n')}

📈 *Recent Achievements:*
${achievements.slice(-3).map(a => `• ${formatAchievement(a)}`).join('\n')}

💡 *Keep playing to unlock more achievements!*
`

    await m.reply(achievementsText)
}

// Show user level information
async function showUserLevel(sock, m, user) {
    const levelInfo = await User.getLevelInfo(user.jid)
    const stats = await User.getStats(user.jid)
    
    const levelText = `
🏆 *LEVEL INFORMATION*

👤 *Current Level:* ${levelInfo.level}
📊 *Experience:* ${levelInfo.experience}/${levelInfo.nextLevelXP}
📈 *Progress:* ${levelInfo.progress.toFixed(1)}%
🎯 *XP Needed:* ${levelInfo.xpNeeded}

📊 *Level Breakdown:*
• Current Level XP: ${levelInfo.currentLevelXP}
• Next Level XP: ${levelInfo.nextLevelXP}
• XP in Current Level: ${levelInfo.experience - levelInfo.currentLevelXP}

💡 *How to gain XP:*
• Send messages: +1 XP each
• Use commands: +5 XP each
• Daily bonus: +50 XP
• Level up bonus: +${levelInfo.level * 10} XP

🎯 *Next Milestones:*
${getNextMilestones(levelInfo.level)}

💎 *Premium Benefits:*
• Higher daily limits
• More features
• Priority support
• Exclusive access

💡 *Commands:*
• \`!premium upgrade\` - Upgrade for more benefits
• \`!profile stats\` - View detailed statistics
• \`!profile achievements\` - View achievements
`

    await m.reply(levelText)
}

// Helper functions
function formatAchievement(achievement) {
    const achievementMap = {
        'level_10': 'Level 10',
        'level_20': 'Level 20',
        'level_30': 'Level 30',
        'first_command': 'First Command',
        'premium_user': 'Premium User',
        'daily_user': 'Daily User',
        'command_master': 'Command Master',
        'chat_king': 'Chat King'
    }
    
    return achievementMap[achievement] || achievement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getAchievementInfo(achievement) {
    const achievementData = {
        'level_10': {
            name: 'Level 10',
            description: 'Reached level 10',
            icon: '🔟'
        },
        'level_20': {
            name: 'Level 20',
            description: 'Reached level 20',
            icon: '2️⃣0️⃣'
        },
        'level_30': {
            name: 'Level 30',
            description: 'Reached level 30',
            icon: '3️⃣0️⃣'
        },
        'first_command': {
            name: 'First Command',
            description: 'Used your first command',
            icon: '🎯'
        },
        'premium_user': {
            name: 'Premium User',
            description: 'Upgraded to premium plan',
            icon: '💎'
        },
        'daily_user': {
            name: 'Daily User',
            description: 'Used bot for 7 consecutive days',
            icon: '📅'
        },
        'command_master': {
            name: 'Command Master',
            description: 'Used 100 commands',
            icon: '⚡'
        },
        'chat_king': {
            name: 'Chat King',
            description: 'Sent 1000 messages',
            icon: '👑'
        }
    }
    
    return achievementData[achievement] || {
        name: formatAchievement(achievement),
        description: 'Achievement unlocked',
        icon: '🏆'
    }
}

function getNextMilestones(currentLevel) {
    const milestones = [10, 20, 30, 50, 100]
    const nextMilestones = milestones.filter(m => m > currentLevel).slice(0, 3)
    
    if (nextMilestones.length === 0) {
        return '🎉 You have reached all milestones!'
    }
    
    return nextMilestones.map(m => `• Level ${m}: ${m * 100} XP needed`).join('\n')
}

export default handler