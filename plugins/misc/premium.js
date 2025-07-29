import PremiumOrder from '../../database/models/PremiumOrder.js'
import PterodactylAPI from '../../helper/pterodactyl.js'

export async function premiumCatalogCmd(sock, m) {
    try {
        const catalogText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 *KATALOG PREMIUM FEATURES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 *PREMIUM PACKAGES*
💎 P1 - Premium Basic
   • Unlimited AI requests
   • Priority support
   • Custom commands
   • Advanced features
   💵 IDR 25.000/bulan

💎 P2 - Premium Pro
   • All Basic features
   • Custom bot branding
   • Multi-device support
   • API access
   💵 IDR 50.000/bulan

💎 P3 - Premium Enterprise
   • All Pro features
   • White-label solution
   • Dedicated support
   • Custom integrations
   💵 IDR 100.000/bulan

🎯 *Cara Order Premium*
• .premium-order [kode] [username]
  Contoh: .premium-order p1 kanata
• Contoh: .premium-order p2 roy
• Contoh: .premium-order p3 sonata

🔎 *Cek Status Premium*
• .premium-status [order-id]
• .my-premium-orders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Powered by Kanata Bot* ✨
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
        const args = m.message?.conversation?.split(' ') || m.message?.extendedTextMessage?.text?.split(' ')
        
        if (args.length < 3) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.premium-order [kode] [username]

📋 *Contoh:*
.premium-order p1 kanata
.premium-order p2 roy

🎯 *Kode yang tersedia:*
• p1 - Premium Basic (IDR 25.000)
• p2 - Premium Pro (IDR 50.000)
• p3 - Premium Enterprise (IDR 100.000)`
            }, { quoted: m })
        }

        const productCode = args[1].toLowerCase()
        const username = args[2]

        // Get product details
        const product = globalThis.getPremiumProduct(productCode)
        if (!product) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Produk tidak ditemukan!*

🔍 Kode produk: *${productCode}*
💡 Ketik .premium-catalog untuk melihat produk yang tersedia.`
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
📦 Produk: *${pendingOrder.productName}*
📋 Status: *${pendingOrder.status}*

💡 Selesaikan pesanan sebelumnya terlebih dahulu.`
            }, { quoted: m })
        }

        // Create premium order
        const order = await PremiumOrder.create({
            userId: m.sender,
            username: username,
            productCode: productCode,
            productName: product.name,
            price: product.price,
            features: product.features
        })

        // Send order details
        const orderText = `
💎 *PESANAN PREMIUM BERHASIL DIBUAT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Username: *${username}*
📦 Produk: *${product.name}*
💰 Harga: *${PremiumOrder.formatPrice(product.price)}*
⏰ Waktu: *${new Date(order.createdAt).toLocaleString('id-ID')}*

📋 *Fitur yang didapat:*
${product.features.map(feature => `• ${feature}`).join('\n')}

💳 *Cara Pembayaran:*
1. Transfer ke rekening yang tertera
2. Kirim bukti transfer (gambar tanpa caption)
3. Admin akan konfirmasi dalam 1x24 jam

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
👤 Customer: *${m.pushName}* (${m.sender})
📦 Produk: *${product.name}*
💰 Harga: *${PremiumOrder.formatPrice(product.price)}*
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

        const statusText = `
💎 *STATUS PESANAN PREMIUM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Username: *${order.username}*
📦 Produk: *${order.productName}*
💰 Harga: *${PremiumOrder.formatPrice(order.price)}*
📋 Status: *${getStatusText(order.status)}*
⏰ Dibuat: *${new Date(order.createdAt).toLocaleString('id-ID')}*

${order.updatedAt ? `🔄 Diupdate: *${new Date(order.updatedAt).toLocaleString('id-ID')}*` : ''}

${order.paymentProof ? `📸 Bukti pembayaran: *Tersedia*` : ''}
${order.premiumDetails ? `✨ Premium aktif hingga: *${new Date(order.premiumDetails.expiresAt).toLocaleString('id-ID')}*` : ''}

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
        const userOrders = await PremiumOrder.getByUserId(m.sender)

        if (userOrders.length === 0) {
            return await sock.sendMessage(m.chat, {
                text: `📭 *Tidak ada pesanan premium*

Anda belum memiliki pesanan premium.
💡 Ketik .premium-catalog untuk melihat produk yang tersedia.`
            }, { quoted: m })
        }

        let ordersText = `💎 *PESANAN PREMIUM ANDA*\n\n`
        
        userOrders.forEach((order, index) => {
            ordersText += `${index + 1}. *${order.productName}*\n`
            ordersText += `   🆔 ID: ${order.id}\n`
            ordersText += `   💰 Harga: ${PremiumOrder.formatPrice(order.price)}\n`
            ordersText += `   📋 Status: ${getStatusText(order.status)}\n`
            ordersText += `   ⏰ ${new Date(order.createdAt).toLocaleString('id-ID')}\n\n`
        })

        ordersText += `💡 Ketik .premium-status [order-id] untuk detail lengkap.`

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

// Admin command to confirm premium payment
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

        // Create premium account
        const premiumResult = await createPremiumAccount(order.username, order.productCode)

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
                accessToken: premiumResult.accessToken
            }
        })

        // Notify admin
        await sock.sendMessage(m.chat, {
            text: `✅ *PREMIUM BERHASIL DIAKTIFKAN*

🆔 Order ID: *${orderId}*
👤 Username: *${order.username}*
💎 Package: *${order.productName}*
⏰ Aktif hingga: *${new Date(premiumResult.expiresAt).toLocaleString('id-ID')}*

Premium account berhasil dibuat dan customer akan diberitahu.`
        }, { quoted: m })

        // Notify customer
        const customerNotif = `
🎉 *PREMIUM ANDA TELAH AKTIF!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${orderId}*
💎 Package: *${order.productName}*

✨ *DETAIL PREMIUM:*
⏰ Aktif hingga: *${new Date(premiumResult.expiresAt).toLocaleString('id-ID')}*
🔑 Access Token: *${premiumResult.accessToken}*

📋 *Fitur yang aktif:*
${premiumResult.features.map(feature => `• ${feature}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Premium features Anda sudah siap digunakan!

💡 *Cara menggunakan:*
1. Gunakan command premium seperti biasa
2. Bot akan otomatis mendeteksi status premium
3. Nikmati fitur-fitur premium yang telah diaktifkan

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

        // Notify user
        await sock.sendMessage(m.chat, {
            text: `✅ *BUKTI PEMBAYARAN PREMIUM DITERIMA*

🆔 Order ID: *${pendingOrder.id}*
💎 Package: *${pendingOrder.productName}*

📋 Status berubah menjadi: *Menunggu Konfirmasi Admin*

⏰ Pembayaran Anda akan dikonfirmasi dalam 1x24 jam.
💡 Ketik .premium-status ${pendingOrder.id} untuk cek status terbaru.`
        }, { quoted: m })

        // Notify admin
        const adminNotif = `
💳 *BUKTI PEMBAYARAN PREMIUM DITERIMA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${pendingOrder.id}*
👤 Customer: *${m.pushName}* (${m.sender})
💎 Package: *${pendingOrder.productName}*
💰 Harga: *${PremiumOrder.formatPrice(pendingOrder.price)}*

📸 Customer telah mengirim bukti pembayaran premium.

✅ Ketik: .premium-payment-done ${pendingOrder.id}
❌ Ketik: .premium-payment-cancel ${pendingOrder.id}
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
💎 Package: *${order.productName}*

Pesanan telah dibatalkan dan customer akan diberitahu.`
        }, { quoted: m })

        // Notify customer
        const customerNotif = `
❌ *PESANAN PREMIUM DIBATALKAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${orderId}*
💎 Package: *${order.productName}*

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

async function createPremiumAccount(username, productCode) {
    try {
        const product = globalThis.getPremiumProduct(productCode)
        if (!product) {
            return { success: false, error: 'Product not found' }
        }

        // Generate premium access token
        const accessToken = generateAccessToken(username)
        
        // Calculate expiration date (30 days from now)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        return {
            success: true,
            accessToken: accessToken,
            expiresAt: expiresAt.toISOString(),
            features: product.features
        }

    } catch (error) {
        console.error('Error creating premium account:', error)
        return { success: false, error: error.message }
    }
}

function generateAccessToken(username) {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `prem_${username}_${timestamp}_${random}`
}