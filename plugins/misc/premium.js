import PremiumOrder from '../../database/models/PremiumOrder.js'
import User, { PREMIUM_PLANS } from '../../database/models/User.js'

export async function premiumCatalogCmd(sock, m) {
    try {
        const user = await User.getById(m.sender)
        
        if (!user.registered) {
            return await sock.sendMessage(m.chat, {
                text: '❌ *Premium Access Denied*\n\nAnda harus registrasi terlebih dahulu!\nGunakan: !register <nama>'
            }, { quoted: m })
        }

        const catalogText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 *KATALOG PREMIUM PLANS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(PREMIUM_PLANS).map(([key, plan]) => {
    if (key === 'FREE') return '' // Skip FREE plan in catalog
    
    const isCurrent = user.premiumPlan === key
    const canUpgrade = plan.level > PREMIUM_PLANS[user.premiumPlan].level
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
• *Plan:* ${PREMIUM_PLANS[user.premiumPlan].name}
• *Level:* ${PREMIUM_PLANS[user.premiumPlan].level}
• *Daily Limit:* ${PREMIUM_PLANS[user.premiumPlan].dailyLimit} commands
${user.premiumExpiry ? `• *Expires:* ${new Date(user.premiumExpiry).toLocaleDateString('id-ID')}` : ''}

🎯 *Cara Order Premium*
• .premium-order [kode] [username]
  Contoh: .premium-order basic johndoe
  Contoh: .premium-order premium alice
  Contoh: .premium-order vip bob

🔎 *Cek Status Premium*
• .premium-status [order-id]
• .my-premium-orders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Auto-Provisioning System* ✨
`

        await sock.sendMessage(m.chat, {
            text: catalogText
        }, { quoted: m })

    } catch (error) {
        console.error('Error in premium catalog command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat menampilkan katalog premium.'
        }, { quoted: m })
    }
}

export async function premiumOrderCmd(sock, m) {
    try {
        const user = await User.getById(m.sender)
        
        if (!user.registered) {
            return await sock.sendMessage(m.chat, {
                text: '❌ *Order Failed*\n\nAnda harus registrasi terlebih dahulu!\nGunakan: !register <nama>'
            }, { quoted: m })
        }

        const args = m.message?.conversation?.split(' ') || m.message?.extendedTextMessage?.text?.split(' ')
        
        if (args.length < 3) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.premium-order [plan] [username]

📋 *Contoh:*
.premium-order basic johndoe
.premium-order premium alice
.premium-order vip bob

🎯 *Plan yang tersedia:*
• basic - Basic Plan (Rp ${PREMIUM_PLANS.BASIC.price.toLocaleString()})
• premium - Premium Plan (Rp ${PREMIUM_PLANS.PREMIUM.price.toLocaleString()})
• vip - VIP Plan (Rp ${PREMIUM_PLANS.VIP.price.toLocaleString()})`
            }, { quoted: m })
        }

        const planKey = args[1].toUpperCase()
        const username = args[2]

        // Validate plan
        if (!PREMIUM_PLANS[planKey] || planKey === 'FREE') {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Plan tidak ditemukan!*

🔍 Plan: *${args[1]}*
💡 Ketik .premium-catalog untuk melihat plan yang tersedia.`
            }, { quoted: m })
        }

        const plan = PREMIUM_PLANS[planKey]
        const currentPlan = PREMIUM_PLANS[user.premiumPlan]

        // Check if user can upgrade to this plan
        if (plan.level <= currentPlan.level) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Upgrade Invalid!*

📊 Plan saat ini: *${currentPlan.name}* (Level ${currentPlan.level})
🎯 Plan yang dipilih: *${plan.name}* (Level ${plan.level})

💡 Anda hanya bisa upgrade ke plan yang lebih tinggi.`
            }, { quoted: m })
        }

        // Check if user already has pending premium order
        const userOrders = await PremiumOrder.getByUserId(m.sender)
        const pendingOrder = userOrders.find(order => 
            order.status === 'pending' || order.status === 'payment_sent'
        )

        if (pendingOrder) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Anda masih memiliki pesanan pending!*

🆔 Order ID: *${pendingOrder.id}*
📦 Plan: *${pendingOrder.productName}*
📋 Status: *${pendingOrder.status}*

💡 Selesaikan pesanan sebelumnya terlebih dahulu.`
            }, { quoted: m })
        }

        // Create premium order
        const order = await PremiumOrder.create({
            userId: m.sender,
            username: username,
            productCode: planKey,
            productName: plan.name,
            price: plan.price,
            features: plan.features
        })

        // Send order details
        const orderText = `
💎 *PESANAN PREMIUM BERHASIL DIBUAT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Username: *${username}*
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

        await sock.sendMessage(m.chat, {
            text: orderText
        }, { quoted: m })

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
👤 Customer: *${user.name || m.pushName}* (${m.sender})
📱 Username: *${username}*
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

    } catch (error) {
        console.error('Error in premium order command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat memproses pesanan premium.'
        }, { quoted: m })
    }
}

export async function premiumStatusCmd(sock, m) {
    try {
        const args = m.message?.conversation?.split(' ') || m.message?.extendedTextMessage?.text?.split(' ')
        
        if (args.length < 2) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.premium-status [order-id]

📋 *Contoh:*
.premium-status PREM-123456-ABC`
            }, { quoted: m })
        }

        const orderId = args[1]
        const order = await PremiumOrder.getById(orderId)

        if (!order) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Pesanan tidak ditemukan!*

🔍 Order ID: *${orderId}*

💡 Pastikan ID pesanan benar atau hubungi admin.`
            }, { quoted: m })
        }

        // Check if user owns this order or is admin
        if (order.userId !== m.sender && !globalThis.isPremiumAdmin(m.sender)) {
            return await sock.sendMessage(m.chat, {
                text: '❌ Anda tidak memiliki akses untuk melihat pesanan ini.'
            }, { quoted: m })
        }

        const plan = PREMIUM_PLANS[order.productCode]
        const statusText = `
💎 *STATUS PESANAN PREMIUM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Username: *${order.username}*
📦 Plan: *${order.productName}*
💰 Harga: *${PremiumOrder.formatPrice(order.price)}*
📊 Daily Limit: *${plan.dailyLimit}* commands
🏆 Level: *${plan.level}*
📋 Status: *${getStatusText(order.status)}*
⏰ Dibuat: *${new Date(order.createdAt).toLocaleString('id-ID')}*

${order.updatedAt ? `🔄 Diupdate: *${new Date(order.updatedAt).toLocaleString('id-ID')}*` : ''}

${order.paymentProof ? `📸 Bukti pembayaran: *Tersedia*` : ''}
${order.premiumDetails ? `✨ Premium aktif hingga: *${new Date(order.premiumDetails.expiresAt).toLocaleString('id-ID')}*` : ''}

📋 *Fitur yang akan/sudah aktif:*
${plan.features.map(feature => `• ${formatFeature(feature)}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

        await sock.sendMessage(m.chat, {
            text: statusText
        }, { quoted: m })

    } catch (error) {
        console.error('Error in premium status command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat mengecek status pesanan.'
        }, { quoted: m })
    }
}

export async function myPremiumOrdersCmd(sock, m) {
    try {
        const user = await User.getById(m.sender)
        const userOrders = await PremiumOrder.getByUserId(m.sender)

        if (userOrders.length === 0) {
            return await sock.sendMessage(m.chat, {
                text: `📭 *Tidak ada pesanan premium*

Anda belum memiliki pesanan premium.
💡 Ketik .premium-catalog untuk melihat plan yang tersedia.

📊 *Status Saat Ini:*
• Plan: ${PREMIUM_PLANS[user.premiumPlan].name}
• Level: ${PREMIUM_PLANS[user.premiumPlan].level}
• Daily Limit: ${PREMIUM_PLANS[user.premiumPlan].dailyLimit} commands`
            }, { quoted: m })
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

        await sock.sendMessage(m.chat, {
            text: ordersText
        }, { quoted: m })

    } catch (error) {
        console.error('Error in my premium orders command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat mengambil data pesanan.'
        }, { quoted: m })
    }
}

// Admin command to confirm premium payment with auto-provisioning
export async function premiumPaymentDoneCmd(sock, m) {
    try {
        // Check if user is admin
        if (!globalThis.isPremiumAdmin(m.sender)) {
            return await sock.sendMessage(m.chat, {
                text: '❌ Anda tidak memiliki akses untuk menjalankan command ini.'
            }, { quoted: m })
        }

        const args = m.message?.conversation?.split(' ') || m.message?.extendedTextMessage?.text?.split(' ')
        if (args.length < 2) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.premium-payment-done [order-id]

📋 *Contoh:*
.premium-payment-done PREM-123456-ABC`
            }, { quoted: m })
        }

        const orderId = args[1]
        const order = await PremiumOrder.getById(orderId)

        if (!order) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Pesanan tidak ditemukan!*

🔍 Order ID: *${orderId}*`
            }, { quoted: m })
        }

        if (order.status !== 'payment_sent') {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Status pesanan tidak valid!*

📋 Status saat ini: *${order.status}*
💡 Hanya pesanan dengan status "payment_sent" yang dapat dikonfirmasi.`
            }, { quoted: m })
        }

        // AUTO-PROVISION: Automatically upgrade user plan
        const premiumResult = await autoProvisionPremium(order.userId, order.productCode, order.username)

        if (!premiumResult.success) {
            await sock.sendMessage(m.chat, {
                text: `❌ *Gagal mengaktifkan premium!*

🔍 Error: ${premiumResult.error}

💡 Silakan coba lagi atau hubungi developer.`
            }, { quoted: m })
            return
        }

        // Update order status
        await PremiumOrder.updateStatus(orderId, 'completed', {
            premiumDetails: {
                activatedAt: new Date().toISOString(),
                expiresAt: premiumResult.expiresAt,
                features: premiumResult.features,
                planLevel: premiumResult.planLevel,
                dailyLimit: premiumResult.dailyLimit
            }
        })

        // Notify admin
        await sock.sendMessage(m.chat, {
            text: `✅ *PREMIUM BERHASIL DIAKTIFKAN*

🆔 Order ID: *${orderId}*
👤 Username: *${order.username}*
👤 User ID: *${order.userId}*
💎 Plan: *${order.productName}*
📊 Level: *${premiumResult.planLevel}*
📊 Daily Limit: *${premiumResult.dailyLimit}* commands
⏰ Aktif hingga: *${new Date(premiumResult.expiresAt).toLocaleString('id-ID')}*

🚀 Auto-Provisioning berhasil! Customer akan diberitahu.`
        }, { quoted: m })

        // Notify customer
        const plan = PREMIUM_PLANS[order.productCode]
        const customerNotif = `
🎉 *PREMIUM ANDA TELAH AKTIF!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${orderId}*
💎 Plan: *${order.productName}*

✨ *DETAIL PREMIUM:*
📊 Level: *${plan.level}*
📊 Daily Limit: *${plan.dailyLimit}* commands
⏰ Aktif hingga: *${new Date(premiumResult.expiresAt).toLocaleString('id-ID')}*

📋 *Fitur yang sudah aktif:*
${plan.features.map(feature => `• ${formatFeature(feature)}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Premium features Anda sudah siap digunakan!

💡 *Cara menggunakan:*
1. Gunakan command premium seperti biasa
2. Bot akan otomatis mendeteksi status premium
3. Nikmati fitur-fitur premium yang telah diaktifkan

🔍 *Cek Status:* !profile atau !premium
🆘 *Butuh bantuan?* Hubungi admin
`

        await sock.sendMessage(order.userId, { text: customerNotif })

    } catch (error) {
        console.error('Error in premium payment done command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat memproses konfirmasi pembayaran premium.'
        }, { quoted: m })
    }
}

// Auto-handle premium payment proof images
export async function handlePremiumPaymentProof(sock, m) {
    try {
        // Check if message contains image and user has pending premium orders
        if (!m.message?.imageMessage) return

        const userOrders = await PremiumOrder.getByUserId(m.sender)
        const pendingOrder = userOrders.find(order => order.status === 'pending')

        if (!pendingOrder) return

        // Update order with payment proof
        await PremiumOrder.addPaymentProof(pendingOrder.id, {
            messageId: m.key.id,
            timestamp: new Date().toISOString()
        })

        const plan = PREMIUM_PLANS[pendingOrder.productCode]

        // Notify user
        await sock.sendMessage(m.chat, {
            text: `✅ *BUKTI PEMBAYARAN PREMIUM DITERIMA*

🆔 Order ID: *${pendingOrder.id}*
💎 Plan: *${pendingOrder.productName}*
📊 Level: *${plan.level}*

📋 Status berubah menjadi: *Menunggu Konfirmasi Admin*

⏰ Pembayaran Anda akan dikonfirmasi dalam 1x24 jam.
🚀 Premium akan otomatis aktif setelah konfirmasi admin.
💡 Ketik .premium-status ${pendingOrder.id} untuk cek status terbaru.`
        }, { quoted: m })

        // Notify admin
        const adminNotif = `
💳 *BUKTI PEMBAYARAN PREMIUM DITERIMA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${pendingOrder.id}*
👤 Customer: *${m.pushName}* (${m.sender})
💎 Plan: *${pendingOrder.productName}*
💰 Harga: *${PremiumOrder.formatPrice(pendingOrder.price)}*
📊 Level: *${plan.level}*
📊 Daily Limit: *${plan.dailyLimit}* commands

📸 Customer telah mengirim bukti pembayaran premium.

✅ Ketik: .premium-payment-done ${pendingOrder.id}
❌ Ketik: .premium-payment-cancel ${pendingOrder.id}

🚀 Setelah konfirmasi, premium akan otomatis aktif!
`

        await sock.sendMessage(globalThis.premiumConfig.admin.owner + '@s.whatsapp.net', {
            text: adminNotif
        })

    } catch (error) {
        console.error('Error handling premium payment proof:', error)
    }
}

// Admin command to cancel premium payment
export async function premiumPaymentCancelCmd(sock, m) {
    try {
        // Check if user is admin
        if (!globalThis.isPremiumAdmin(m.sender)) {
            return await sock.sendMessage(m.chat, {
                text: '❌ Anda tidak memiliki akses untuk menjalankan command ini.'
            }, { quoted: m })
        }

        const args = m.message?.conversation?.split(' ') || m.message?.extendedTextMessage?.text?.split(' ')
        if (args.length < 2) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.premium-payment-cancel [order-id]

📋 *Contoh:*
.premium-payment-cancel PREM-123456-ABC`
            }, { quoted: m })
        }

        const orderId = args[1]
        const order = await PremiumOrder.getById(orderId)

        if (!order) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Pesanan tidak ditemukan!*

🔍 Order ID: *${orderId}*`
            }, { quoted: m })
        }

        // Update order status
        await PremiumOrder.updateStatus(orderId, 'cancelled')

        // Notify admin
        await sock.sendMessage(m.chat, {
            text: `❌ *PESANAN PREMIUM DIBATALKAN*

🆔 Order ID: *${orderId}*
👤 Username: *${order.username}*
💎 Plan: *${order.productName}*

Pesanan telah dibatalkan dan customer akan diberitahu.`
        }, { quoted: m })

        // Notify customer
        const customerNotif = `
❌ *PESANAN PREMIUM DIBATALKAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${orderId}*
💎 Plan: *${order.productName}*

Pesanan premium Anda telah dibatalkan oleh admin.

💡 Jika Anda merasa ini adalah kesalahan, silakan hubungi admin.
`

        await sock.sendMessage(order.userId, { text: customerNotif })

    } catch (error) {
        console.error('Error in premium payment cancel command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat membatalkan pesanan premium.'
        }, { quoted: m })
    }
}

// AUTO-PROVISIONING: Automatically upgrade user plan
async function autoProvisionPremium(userId, planKey, username) {
    try {
        const plan = PREMIUM_PLANS[planKey]
        if (!plan) {
            return { success: false, error: 'Invalid plan' }
        }

        // Upgrade user plan with auto-provisioning
        const user = await User.upgradePlan(userId, planKey)
        
        // Calculate expiration date (30 days from now)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        return {
            success: true,
            expiresAt: expiresAt.toISOString(),
            features: plan.features,
            planLevel: plan.level,
            dailyLimit: plan.dailyLimit,
            planName: plan.name
        }

    } catch (error) {
        console.error('Error in auto-provisioning premium:', error)
        return { success: false, error: error.message }
    }
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