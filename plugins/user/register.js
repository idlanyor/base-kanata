import User, { PREMIUM_PLANS } from '../../database/models/User.js'

export const handler = {
    command: ['register', 'daftar', 'signup'],
    tags: ['user'],
    help: 'User registration and onboarding',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        args = args.split(' ')
        try {
            const jid = m.sender
            const user = await User.getById(jid)

            if (user.registered) {
                return await showRegisteredUserInfo(sock, m, user)
            }

            if (args.length < 1) {
                return await showRegistrationHelp(sock, m)
            }

            const name = args.join(' ')

            if (name.length < 2) {
                return await m.reply(`❌ *Name Too Short!*

📝 Nama harus minimal 2 karakter.
💡 Contoh: !register John Doe`)
            }

            if (name.length > 50) {
                return await m.reply(`❌ *Name Too Long!*

📝 Nama maksimal 50 karakter.
💡 Gunakan nama yang lebih pendek.`)
            }

            await registerUser(sock, m, name)

        } catch (error) {
            console.error('Registration error:', error)
            await m.reply('❌ *Error*\nTerjadi kesalahan saat registrasi. Silakan coba lagi.')
        }
    }
}

// Register new user
async function registerUser(sock, m, name) {
    try {
        const user = await User.register(m.sender, { name })
        const levelInfo = await User.getLevelInfo(m.sender)

        const welcomeText = `
🎉 *REGISTRATION SUCCESSFUL!*

👤 *Welcome, ${name}!*
✅ Account successfully registered
🏆 Level: ${levelInfo.level}
📊 XP: ${levelInfo.experience}/${levelInfo.nextLevelXP}

💎 *Your Plan: ${PREMIUM_PLANS[user.premiumPlan].name}*
📊 Daily Limit: ${PREMIUM_PLANS[user.premiumPlan].dailyLimit} commands
✨ Features: ${PREMIUM_PLANS[user.premiumPlan].features.length} features

🎁 *Welcome Bonus:*
• +100 XP for registration
• Access to basic commands
• Daily usage tracking
• Achievement system

📋 *Available Commands:*
• \`!profile\` - View your profile
• \`!premium\` - Premium status & plans
• \`!premium upgrade\` - Upgrade options
• \`!profile setbio <text>\` - Set custom bio
• \`!profile stats\` - View statistics

💡 *Tips:*
• Use commands to gain XP and level up
• Upgrade to premium for more features
• Stay active to unlock achievements
• Check !premium plans for upgrade options

🎯 *Next Steps:*
1. Try some basic commands
2. Check your profile with !profile
3. Explore premium features with !premium
4. Set your bio with !profile setbio <text>

Welcome to the bot community! 🚀
`

        await m.reply(welcomeText)

        // Send welcome bonus achievement
        await User.addAchievement(m.sender, 'first_registration')

        // Notify admin about new registration
        const adminNotif = `
🆕 *NEW USER REGISTRATION*

👤 *User:* ${name}
📱 *Number:* ${m.sender}
⏰ *Time:* ${new Date().toLocaleString('id-ID')}

📊 *User Stats:*
• Total Users: ${await getTotalUsers()}
• Active Today: ${await getActiveUsersToday()}

💡 New user has been registered and can now access premium features.
`

        if (globalThis.premiumConfig?.admin?.owner) {
            await sock.sendMessage(globalThis.premiumConfig.admin.owner + '@s.whatsapp.net', {
                text: adminNotif
            })
        }

    } catch (error) {
        console.error('Error registering user:', error)
        await m.reply('❌ *Registration Failed*\nTerjadi kesalahan saat registrasi. Silakan coba lagi.')
    }
}

// Show registration help
async function showRegistrationHelp(sock, m) {
    const helpText = `
📝 *USER REGISTRATION*

❌ *You are not registered yet!*

📋 *How to register:*
!register <nama>

📋 *Contoh:*
!register John Doe
!register Alice Smith
!register Bob Johnson

📝 *Requirements:*
• Nama minimal 2 karakter
• Nama maksimal 50 karakter
• Satu kali registrasi per user

🎁 *Benefits after registration:*
• Access to all basic commands
• Profile management
• Premium features access
• Achievement system
• Daily usage tracking
• Level progression

💡 *After registration you can:*
• View profile with !profile
• Check premium plans with !premium
• Set custom bio with !profile setbio
• View statistics with !profile stats
• Upgrade to premium with !premium upgrade

🚀 *Ready to start?*
Use: !register <your_name>
`

    await m.reply(helpText)
}

// Show info for already registered user
async function showRegisteredUserInfo(sock, m, user) {
    const premiumStatus = await User.checkPremiumStatus(user.jid)
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const levelInfo = await User.getLevelInfo(user.jid)
    const stats = await User.getStats(user.jid)

    const infoText = `
✅ *ALREADY REGISTERED*

👤 *User Info:*
• Nama: ${user.name}
• Number: ${user.number}
• Registered: ${new Date(user.joinDate).toLocaleDateString('id-ID')}
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

💡 *Available Commands:*
• \`!profile\` - View your profile
• \`!premium\` - Premium status & plans
• \`!premium upgrade\` - Upgrade options
• \`!profile setbio <text>\` - Set custom bio
• \`!profile stats\` - View statistics
• \`!profile achievements\` - View achievements

🎯 *Quick Actions:*
• Check premium plans: !premium plans
• View detailed stats: !profile stats
• Set custom bio: !profile setbio <text>
• Upgrade premium: !premium upgrade
`

    await m.reply(infoText)
}

// Helper functions
async function getTotalUsers() {
    try {
        const users = await User.getRegisteredUsers()
        return users.length
    } catch (error) {
        return 'Unknown'
    }
}

async function getActiveUsersToday() {
    try {
        const users = await User.getRegisteredUsers()
        const today = new Date().toISOString().split('T')[0]
        const activeToday = users.filter(user =>
            user.lastSeen && user.lastSeen.includes(today)
        )
        return activeToday.length
    } catch (error) {
        return 'Unknown'
    }
}

export default handler