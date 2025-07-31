import User, { PREMIUM_PLANS } from '../../database/models/User.js'
import PremiumOrder from '../../database/models/PremiumOrder.js'

export const handler = {
    command: ['premium', 'vip', 'plan', 'upgrade', 'profile', 'stats'],
    tags: ['user'],
    help: 'Premium user management and plan information',
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
                return await m.reply('❌ *Premium Access Denied*\n\nAnda harus registrasi terlebih dahulu!\nGunakan: !register <nama>')
            }

            const command = args[0]?.toLowerCase() || 'info'
            
            switch (command) {
                case 'info':
                case 'status':
                    await showPremiumStatus(sock, m, user)
                    break
                    
                case 'plans':
                case 'catalog':
                    await showPremiumPlans(sock, m, user)
                    break
                    
                case 'order':
                    await handlePremiumOrder(sock, m, args.slice(1))
                    break
                    
                case 'orders':
                case 'my-orders':
                    await showUserOrders(sock, m, user)
                    break
                    
                case 'usage':
                case 'limits':
                    await showUsageLimits(sock, m, user)
                    break
                    
                case 'features':
                    await showPremiumFeatures(sock, m, user)
                    break
                    
                case 'upgrade':
                    await showUpgradeOptions(sock, m, user)
                    break
                    
                case 'stats':
                case 'statistics':
                    await showUserStats(sock, m, user)
                    break
                    
                default:
                    await showPremiumHelp(sock, m)
                    break
            }
            
        } catch (error) {
            console.error('Premium command error:', error)
            await m.reply('❌ *Error*\nTerjadi kesalahan saat memproses command premium.')
        }
    }
}

// Show comprehensive premium status
async function showPremiumStatus(sock, m, user) {
    const premiumStatus = await User.checkPremiumStatus(user.jid)
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const levelInfo = await User.getLevelInfo(user.jid)
    const usage = await User.checkLimit(user.jid, 'command')
    
    const statusText = `
💎 *PREMIUM STATUS*

👤 *User Info:*
• Nama: ${user.name}
• Level: ${levelInfo.level} (${levelInfo.progress.toFixed(1)}%)
• XP: ${levelInfo.experience}/${levelInfo.nextLevelXP}

💎 *Premium Plan:*
• Plan: ${currentPlan.name}
• Status: ${premiumStatus ? '🟢 Active' : '🔴 Inactive'}
• Level: ${currentPlan.level}
• Daily Limit: ${currentPlan.dailyLimit} commands
${user.premiumExpiry ? `• Expires: ${new Date(user.premiumExpiry).toLocaleDateString('id-ID')}` : ''}

📊 *Usage Today:*
• Commands: ${usage.used}/${usage.limit} (${usage.remaining} remaining)
• Messages: ${user.dailyUsage.messages || 0}

✨ *Active Features:*
${currentPlan.features.map(feature => `• ${formatFeature(feature)}`).join('\n')}

💡 *Commands:*
• \`!premium plans\` - Lihat semua plans
• \`!premium order <plan>\` - Order premium
• \`!premium orders\` - Lihat pesanan
• \`!premium usage\` - Cek usage limits
• \`!premium features\` - Lihat fitur aktif
• \`!premium upgrade\` - Upgrade options
• \`!premium stats\` - User statistics
`

    await m.reply(statusText)
}

// Show all available premium plans
async function showPremiumPlans(sock, m, user) {
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    
    const plansText = `
💎 *PREMIUM PLANS CATALOG*

${Object.entries(PREMIUM_PLANS).map(([key, plan]) => {
    if (key === 'FREE') return '' // Skip FREE plan in catalog
    
    const isCurrent = user.premiumPlan === key
    const canUpgrade = plan.level > currentPlan.level
    const status = isCurrent ? '✅ AKTIF' : canUpgrade ? '🔄 UPGRADE' : '💡 TERSEDIA'
    
    return `${status} *${plan.name} Plan*
💰 Harga: Rp ${plan.price.toLocaleString()}/bulan
📊 Daily Limit: ${plan.dailyLimit} commands
🏆 Level: ${plan.level}
✨ Features: ${plan.features.length} fitur premium

📋 *Fitur yang didapat:*
${plan.features.map(feature => `• ${formatFeature(feature)}`).join('\n')}

🎯 *Order Code:* ${key.toLowerCase()}`
}).filter(Boolean).join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n')}

📊 *Status Anda Saat Ini:*
• *Plan:* ${currentPlan.name}
• *Level:* ${currentPlan.level}
• *Daily Limit:* ${currentPlan.dailyLimit} commands
${user.premiumExpiry ? `• *Expires:* ${new Date(user.premiumExpiry).toLocaleDateString('id-ID')}` : ''}

🎯 *Cara Order Premium*
• !premium order basic
• !premium order premium
• !premium order vip

🔍 *Cek Status Order*
• .premium-status [order-id]
• .my-premium-orders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Auto-Provisioning System* ✨
`

    await m.reply(plansText)
}

// Handle premium order creation
async function handlePremiumOrder(sock, m, args) {
    if (args.length < 1) {
        return await m.reply(`❌ *Format Salah!*

📝 *Cara penggunaan:*
!premium order <plan>

📋 *Contoh:*
!premium order basic
!premium order premium
!premium order vip

🎯 *Plan yang tersedia:*
• basic - Basic Plan (Rp ${PREMIUM_PLANS.BASIC.price.toLocaleString()})
• premium - Premium Plan (Rp ${PREMIUM_PLANS.PREMIUM.price.toLocaleString()})
• vip - VIP Plan (Rp ${PREMIUM_PLANS.VIP.price.toLocaleString()})`)
    }

    const planKey = args[0].toUpperCase()
    const user = await User.getById(m.sender)

    // Validate plan
    if (!PREMIUM_PLANS[planKey] || planKey === 'FREE') {
        return await m.reply(`❌ *Plan tidak ditemukan!*

🔍 Plan: *${args[0]}*
💡 Ketik !premium plans untuk melihat plan yang tersedia.`)
    }

    const plan = PREMIUM_PLANS[planKey]
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]

    // Check if user can upgrade to this plan
    if (plan.level <= currentPlan.level) {
        return await m.reply(`❌ *Upgrade Invalid!*

📊 Plan saat ini: *${currentPlan.name}* (Level ${currentPlan.level})
🎯 Plan yang dipilih: *${plan.name}* (Level ${plan.level})

💡 Anda hanya bisa upgrade ke plan yang lebih tinggi.`)
    }

    // Check if user already has pending premium order
    const userOrders = await PremiumOrder.getByUserId(m.sender)
    const pendingOrder = userOrders.find(order => 
        order.status === 'pending' || order.status === 'payment_sent'
    )

    if (pendingOrder) {
        return await m.reply(`❌ *Anda masih memiliki pesanan pending!*

🆔 Order ID: *${pendingOrder.id}*
📦 Plan: *${pendingOrder.productName}*
📋 Status: *${pendingOrder.status}*

💡 Selesaikan pesanan sebelumnya terlebih dahulu.`)
    }

    // Create premium order with username from database
    const order = await PremiumOrder.create({
        userId: m.sender,
        username: user.name, // Use username from database
        productCode: planKey,
        productName: plan.name,
        price: plan.price,
        features: plan.features
    })

    const orderText = `
💎 *PESANAN PREMIUM BERHASIL DIBUAT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Username: *${user.name}*
📦 Plan: *${plan.name}*
💰 Harga: *${PremiumOrder.formatPrice(plan.price)}*
📊 Daily Limit: *${plan.dailyLimit}* commands
🏆 Level: *${plan.level}*
⏰ Waktu: *${new Date(order.createdAt).toLocaleString('id-ID')}*

📋 *Fitur yang akan aktif:*
${plan.features.map(feature => `• ${formatFeature(feature)}`).join('\n')}

💳 *Cara Pembayaran:*
1. Transfer ke rekening yang tertera
2. Kirim bukti transfer (gambar tanpa caption)
3. Admin akan konfirmasi dalam 1x24 jam
4. Premium akan otomatis aktif setelah konfirmasi

🔍 *Cek Status:* .premium-status ${order.id}
`

    await m.reply(orderText)

    // Send QRIS if configured
    if (globalThis.premiumConfig?.qris?.imageUrl) {
        await sock.sendMessage(m.chat, {
            image: { url: globalThis.premiumConfig.qris.imageUrl },
            caption: `💳 *QRIS Payment*\n\nScan QRIS di atas untuk pembayaran cepat.`
        }, { quoted: m })
    }

    // Notify admin about new premium order
    const adminNotif = `
🔔 *PESANAN PREMIUM BARU MASUK*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Customer: *${user.name}* (${m.sender})
📱 Username: *${user.name}*
📦 Plan: *${plan.name}*
💰 Harga: *${PremiumOrder.formatPrice(plan.price)}*
📊 Level: ${currentPlan.name} → ${plan.name}
⏰ Waktu: *${new Date(order.createdAt).toLocaleString('id-ID')}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Menunggu pembayaran dari customer...
`

    await sock.sendMessage(globalThis.premiumConfig.admin.owner + '@s.whatsapp.net', {
        text: adminNotif
    })
}

// Show user's premium orders
async function showUserOrders(sock, m, user) {
    const userOrders = await PremiumOrder.getByUserId(m.sender)

    if (userOrders.length === 0) {
        return await m.reply(`📭 *Tidak ada pesanan premium*

Anda belum memiliki pesanan premium.
💡 Ketik !premium plans untuk melihat plan yang tersedia.

📊 *Status Saat Ini:*
• Plan: ${PREMIUM_PLANS[user.premiumPlan].name}
• Level: ${PREMIUM_PLANS[user.premiumPlan].level}
• Daily Limit: ${PREMIUM_PLANS[user.premiumPlan].dailyLimit} commands`)
    }

    let ordersText = `💎 *PESANAN PREMIUM ANDA*\n\n`
    
    userOrders.forEach((order, index) => {
        const plan = PREMIUM_PLANS[order.productCode]
        ordersText += `${index + 1}. *${order.productName}*\n`
        ordersText += `   🆔 ID: ${order.id}\n`
        ordersText += `   💰 Harga: ${PremiumOrder.formatPrice(order.price)}\n`
        ordersText += `   📊 Level: ${plan.level}\n`
        ordersText += `   📋 Status: ${getStatusText(order.status)}\n`
        ordersText += `   ⏰ ${new Date(order.createdAt).toLocaleString('id-ID')}\n\n`
    })

    ordersText += `📊 *Status Saat Ini:*
• Plan: ${PREMIUM_PLANS[user.premiumPlan].name}
• Level: ${PREMIUM_PLANS[user.premiumPlan].level}
${user.premiumExpiry ? `• Expires: ${new Date(user.premiumExpiry).toLocaleDateString('id-ID')}` : ''}

💡 Ketik .premium-status [order-id] untuk detail lengkap.`

    await m.reply(ordersText)
}

// Show usage limits and statistics
async function showUsageLimits(sock, m, user) {
    const commandUsage = await User.checkLimit(user.jid, 'command')
    const messageUsage = await User.checkLimit(user.jid, 'message')
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const levelInfo = await User.getLevelInfo(user.jid)
    
    const usageText = `
📊 *USAGE & LIMITS*

👤 *User Info:*
• Nama: ${user.name}
• Level: ${levelInfo.level} (${levelInfo.progress.toFixed(1)}%)
• XP: ${levelInfo.experience}/${levelInfo.nextLevelXP}

💎 *Premium Plan:*
• Plan: ${currentPlan.name}
• Level: ${currentPlan.level}
• Daily Limit: ${currentPlan.dailyLimit} commands

📈 *Today's Usage:*
• Commands: ${commandUsage.used}/${commandUsage.limit} (${commandUsage.remaining} remaining)
• Messages: ${messageUsage.used}/${messageUsage.limit} (${messageUsage.remaining} remaining)

⏰ *Reset Time:*
• Daily reset: 00:00 WIB
• Last reset: ${user.dailyUsage.lastReset}

📊 *Usage Breakdown:*
• Commands used: ${user.dailyUsage.commands || 0}
• Messages sent: ${user.dailyUsage.messages || 0}

💡 *Tips:*
• Upgrade premium untuk limit lebih tinggi
• Gunakan !premium upgrade untuk lihat options
• Check !premium features untuk fitur aktif
`

    await m.reply(usageText)
}

// Show active premium features
async function showPremiumFeatures(sock, m, user) {
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const premiumStatus = await User.checkPremiumStatus(user.jid)
    
    const featuresText = `
✨ *PREMIUM FEATURES*

💎 *Current Plan: ${currentPlan.name}*
📊 Level: ${currentPlan.level}
📊 Daily Limit: ${currentPlan.dailyLimit} commands
🔋 Status: ${premiumStatus ? '🟢 Active' : '🔴 Inactive'}

📋 *Active Features:*
${currentPlan.features.map(feature => `• ${formatFeature(feature)}`).join('\n')}

🔍 *Feature Details:*
${getFeatureDetails(currentPlan.features)}

💡 *Upgrade Benefits:*
${getUpgradeBenefits(user.premiumPlan)}

🎯 *Commands:*
• \`!premium plans\` - Lihat semua plans
• \`!premium upgrade\` - Upgrade options
• \`!premium order <plan>\` - Order premium
`

    await m.reply(featuresText)
}

// Show upgrade options
async function showUpgradeOptions(sock, m, user) {
    const currentPlan = PREMIUM_PLANS[user.premiumPlan]
    const availableUpgrades = Object.entries(PREMIUM_PLANS)
        .filter(([key, plan]) => plan.level > currentPlan.level)
        .sort((a, b) => a[1].level - b[1].level)
    
    if (availableUpgrades.length === 0) {
        return await m.reply(`🎉 *Anda sudah di level tertinggi!*

💎 Current Plan: ${currentPlan.name}
🏆 Level: ${currentPlan.level}
📊 Daily Limit: ${currentPlan.dailyLimit} commands

✨ Anda sudah memiliki semua fitur premium yang tersedia!`)
    }
    
    const upgradeText = `
🔄 *UPGRADE OPTIONS*

💎 *Current Plan: ${currentPlan.name}*
📊 Level: ${currentPlan.level}
📊 Daily Limit: ${currentPlan.dailyLimit} commands

📈 *Available Upgrades:*
${availableUpgrades.map(([key, plan]) => `
🆙 *${plan.name} Plan*
💰 Price: Rp ${plan.price.toLocaleString()}/month
📊 Daily Limit: ${plan.dailyLimit} commands (+${plan.dailyLimit - currentPlan.dailyLimit})
🏆 Level: ${plan.level}
✨ New Features: ${plan.features.length - currentPlan.features.length}

📋 *Additional Features:*
${plan.features.filter(f => !currentPlan.features.includes(f)).map(f => `• ${formatFeature(f)}`).join('\n')}

🎯 *Order:* !premium order ${key.toLowerCase()}`).join('\n\n')}

💡 *Benefits of Upgrading:*
• Higher daily limits
• More premium features
• Priority support
• Exclusive access

🔍 *Commands:*
• \`!premium order <plan>\` - Order upgrade
• \`!premium plans\` - View all plans
• \`!premium features\` - Current features
`

    await m.reply(upgradeText)
}

// Show comprehensive user statistics
async function showUserStats(sock, m, user) {
    const stats = await User.getStats(user.jid)
    const levelInfo = await User.getLevelInfo(user.jid)
    const premiumStatus = await User.checkPremiumStatus(user.jid)
    const achievements = await User.getAchievements(user.jid)
    
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
• Today Commands: ${stats.usage.today.commands || 0}/${stats.usage.limits.dailyCommands}
• Today Messages: ${stats.usage.today.messages || 0}/${stats.usage.limits.dailyMessages}
• Sticker Limit: ${stats.usage.limits.stickerLimit}
• Download Limit: ${stats.usage.limits.downloadLimit}

🏅 *Achievements:*
• Total: ${stats.achievements} achievements
• Recent: ${achievements.slice(-3).map(a => formatAchievement(a)).join(', ')}

⚠️ *Warnings:*
• Total: ${stats.warnings}/3
• Status: ${stats.banned ? '🚫 Banned' : '✅ Active'}

💡 *Commands:*
• \`!premium info\` - Current status
• \`!premium usage\` - Usage details
• \`!premium features\` - Active features
• \`!premium upgrade\` - Upgrade options
`

    await m.reply(statsText)
}

// Show premium help
async function showPremiumHelp(sock, m) {
    const helpText = `
💎 *PREMIUM COMMANDS HELP*

📋 *Main Commands:*
• \`!premium\` atau \`!premium info\` - Status premium
• \`!premium plans\` - Lihat semua plans
• \`!premium order <plan>\` - Order premium
• \`!premium orders\` - Lihat pesanan premium
• \`!premium usage\` - Cek usage limits
• \`!premium features\` - Lihat fitur aktif
• \`!premium upgrade\` - Upgrade options
• \`!premium stats\` - User statistics

🎯 *Available Plans:*
• basic - Basic Plan (Rp 50.000/month)
• premium - Premium Plan (Rp 100.000/month)
• vip - VIP Plan (Rp 200.000/month)

📊 *Features by Plan:*
• FREE: Basic commands, Basic AI (50 commands/day)
• BASIC: + Priority support, Custom bio (200 commands/day)
• PREMIUM: + Advanced AI, Unlimited stickers, Voice commands (500 commands/day)
• VIP: + Exclusive features (1000 commands/day)

🔄 *Auto-Provisioning:*
• Order → Payment → Admin Confirm → INSTANT ACTIVATION
• No manual setup needed
• Real-time status updates

💡 *Tips:*
• Register first with \`!register <name>\`
• Check current plan with \`!premium info\`
• Monitor usage with \`!premium usage\`
• Upgrade when needed with \`!premium upgrade\`

🆘 *Need Help?*
Contact admin for premium support
`

    await m.reply(helpText)
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Menunggu Pembayaran',
        'payment_sent': '💳 Menunggu Konfirmasi',
        'completed': '✅ Selesai',
        'cancelled': '❌ Dibatalkan'
    }
    return statusMap[status] || status
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

function getFeatureDetails(features) {
    const details = {
        'basic_commands': 'Access to essential bot commands',
        'basic_ai': 'Basic AI chat and assistance',
        'priority_support': 'Faster response from admin support',
        'custom_bio': 'Set custom profile bio',
        'all_commands': 'Access to all bot commands',
        'advanced_ai': 'Advanced AI with better responses',
        'unlimited_stickers': 'No limit on sticker creation',
        'voice_commands': 'Voice message processing',
        'exclusive_features': 'Access to exclusive bot features'
    }
    
    return features.map(f => `• ${formatFeature(f)}: ${details[f] || 'Premium feature'}`).join('\n')
}

function getUpgradeBenefits(currentPlan) {
    const benefits = {
        'FREE': 'Upgrade to BASIC for more features and higher limits',
        'BASIC': 'Upgrade to PREMIUM for advanced AI and unlimited stickers',
        'PREMIUM': 'Upgrade to VIP for exclusive features and highest limits',
        'VIP': 'You have the highest plan available'
    }
    
    return benefits[currentPlan] || 'Upgrade for more features'
}

function formatAchievement(achievement) {
    const achievementMap = {
        'level_10': 'Level 10',
        'level_20': 'Level 20',
        'level_30': 'Level 30',
        'first_command': 'First Command',
        'premium_user': 'Premium User'
    }
    
    return achievementMap[achievement] || achievement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default handler