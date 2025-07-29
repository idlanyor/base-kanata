import Order from '../../database/models/Order.js'
import PterodactylAPI from '../../helper/pterodactyl.js'

export async function catalogCmd(sock, m) {
    try {
        const catalogText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏪 *KATALOG PRODUK HOSTING*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 *NodeJS VIP (A1-A6)*
💎 A1 - NodeJS Kroco
   1GB, 100% CPU
   💵 IDR 5.000/bulan

💎 A2 - NodeJS Karbit
   2GB, 150% CPU
   💵 IDR 7.500/bulan

💎 A3 - NodeJS Standar
   4GB, 200% CPU
   💵 IDR 10.000/bulan

💎 A4 - NodeJS Sepuh
   5GB, 250% CPU
   💵 IDR 12.500/bulan

💎 A5 - NodeJS Suhu
   8GB, 300% CPU
   💵 IDR 15.000/bulan

💎 A6 - NodeJS Pro Max
   16GB, 400% CPU
   💵 IDR 20.000/bulan

🔧 *VPS (B1-B6)*
💎 B1 - VPS Kroco
   1GB, 100% CPU
   💵 IDR 7.500/bulan

💎 B2 - VPS Karbit
   2GB, 150% CPU
   💵 IDR 10.000/bulan

💎 B3 - VPS Standar
   4GB, 200% CPU
   💵 IDR 15.000/bulan

💎 B4 - VPS Sepuh
   6GB, 250% CPU
   💵 IDR 20.000/bulan

💎 B5 - VPS Suhu
   8GB, 300% CPU
   💵 IDR 25.000/bulan

💎 B6 - VPS Pro Max
   16GB, 400% CPU
   💵 IDR 35.000/bulan

🐍 *Python (C1-C6)*
💎 C1 - Python Kroco
   1GB, 100% CPU
   💵 IDR 3.000/bulan

💎 C2 - Python Karbit
   1GB, 150% CPU
   💵 IDR 5.000/bulan

💎 C3 - Python Standar
   2GB, 150% CPU
   💵 IDR 7.500/bulan

💎 C4 - Python Sepuh
   4GB, 200% CPU
   💵 IDR 10.000/bulan

💎 C5 - Python Suhu
   6GB, 250% CPU
   💵 IDR 12.500/bulan

💎 C6 - Python Pro Max
   8GB, 300% CPU
   💵 IDR 17.500/bulan

🎯 *Cara Order*
• .order [kode] [username]
  Contoh: .order a1 kanata
• Contoh: .order b3 roy
• Contoh: .order c6 sonata

🔎 *Cek Status*
• .order-status [order-id]
• .my-orders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Powered by Kanata Bot* ✨
`

        await sock.sendMessage(m.chat, {
            text: catalogText,
            contextInfo: {
                externalAdReply: {
                    title: "🏪 Katalog Produk Hosting",
                    body: "Pilih paket sesuai kebutuhan Anda",
                    thumbnailUrl: globalThis.bannerUrl,
                    sourceUrl: globalThis.newsletterUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

    } catch (error) {
        console.error('Error in catalog command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat menampilkan katalog.'
        }, { quoted: m })
    }
}

export async function orderCmd(sock, m) {
    try {
        // console.log(m.message?.extendedTextMessage?.text?.split(' '))
        const args = m.message?.conversation?.split(' ') || m.message?.extendedTextMessage?.text?.split(' ')
        if (args.length < 3) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.order [kode] [username]

📋 *Contoh:*
• .order a1 kanata
• .order b3 roy  
• .order c6 sonata

💡 Ketik .catalog untuk melihat daftar produk`
            }, { quoted: m })
        }

        const productCode = args[1].toLowerCase()
        const username = args[2] + '-antidonasi'

        // Validate product
        const product = globalThis.getProduct(productCode)
        if (!product) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Kode produk tidak ditemukan!*

🔍 Kode yang Anda masukkan: *${productCode}*

💡 Ketik .catalog untuk melihat daftar produk yang tersedia`
            }, { quoted: m })
        }

        // Create order
        const orderData = {
            userId: m.sender,
            username: username,
            productCode: productCode,
            productName: product.name,
            price: product.price
        }

        const order = await Order.create(orderData)

        // Send QRIS payment instructions
        const paymentText = `
🎯 *PESANAN BERHASIL DIBUAT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *Detail Pesanan:*
🆔 Order ID: *${order.id}*
👤 Username: *${username}*
📦 Produk: *${product.name}*
💾 Spesifikasi: *${product.ram}, ${product.cpu} CPU*
💰 Harga: *${Order.formatPrice(product.price)}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 *INSTRUKSI PEMBAYARAN*

1️⃣ Scan QR Code yang akan dikirim
2️⃣ Transfer sesuai nominal: *${Order.formatPrice(product.price)}*
3️⃣ Screenshot bukti pembayaran
4️⃣ Kirim screenshot ke nomor bot ini
5️⃣ Tunggu konfirmasi dari admin

⏰ *Batas waktu pembayaran: 24 jam*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Bot akan mengirimkan QR Code dalam beberapa detik...
`

        await sock.sendMessage(m.chat, { text: paymentText }, { quoted: m })

        // Send QRIS image (if available)
        if (globalThis.storeConfig.qris.imageUrl) {
            await sock.sendMessage(m.chat, {
                image: { url: globalThis.storeConfig.qris.imageUrl },
                caption: `💳 *QR Code Pembayaran*

🆔 Order ID: *${order.id}*
💰 Nominal: *${Order.formatPrice(product.price)}*

📸 Screenshot bukti transfer dan kirim ke chat ini setelah melakukan pembayaran.

⚠️ *PENTING:* Pastikan nominal transfer sesuai dengan yang tertera!`
            }, { quoted: m })
        }

        // Notify admin about new order
        const adminNotif = `
🔔 *PESANAN BARU MASUK*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Customer: *${m.pushName}* (${m.sender})
📦 Produk: *${product.name}*
💰 Harga: *${Order.formatPrice(product.price)}*
⏰ Waktu: *${new Date(order.createdAt).toLocaleString('id-ID')}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Menunggu pembayaran dari customer...
`

        await sock.sendMessage(globalThis.storeConfig.admin.owner + '@s.whatsapp.net', {
            text: adminNotif
        })

    } catch (error) {
        console.error('Error in order command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.'
        }, { quoted: m })
    }
}

export async function orderStatusCmd(sock, m) {
    try {
        const args = m.text.split(' ')
        if (args.length < 2) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.order-status [order-id]

📋 *Contoh:*
.order-status ORD-123456-ABC`
            }, { quoted: m })
        }

        const orderId = args[1]
        const order = await Order.getById(orderId)

        if (!order) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Pesanan tidak ditemukan!*

🔍 Order ID: *${orderId}*

💡 Pastikan Order ID benar atau ketik .my-orders untuk melihat pesanan Anda`
            }, { quoted: m })
        }

        // Check if user owns this order or is admin
        if (order.userId !== m.sender && !globalThis.isStoreAdmin(m.sender)) {
            return await sock.sendMessage(m.chat, {
                text: '❌ Anda tidak memiliki akses untuk melihat pesanan ini.'
            }, { quoted: m })
        }

        const statusEmoji = {
            'pending': '⏳',
            'payment_sent': '📋',
            'confirmed': '✅',
            'completed': '🎉',
            'cancelled': '❌'
        }

        const statusText = {
            'pending': 'Menunggu Pembayaran',
            'payment_sent': 'Pembayaran Dikirim, Menunggu Konfirmasi',
            'confirmed': 'Pembayaran Dikonfirmasi',
            'completed': 'Pesanan Selesai',
            'cancelled': 'Pesanan Dibatalkan'
        }

        let statusMessage = `
📋 *STATUS PESANAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${order.id}*
👤 Username: *${order.username}*
📦 Produk: *${order.productName}*
💰 Harga: *${Order.formatPrice(order.price)}*
📅 Tanggal: *${new Date(order.createdAt).toLocaleString('id-ID')}*

${statusEmoji[order.status]} *Status: ${statusText[order.status]}*
`

        if (order.status === 'completed' && order.serverDetails) {
            statusMessage += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️ *DETAIL SERVER*

🌐 Panel URL: *${globalThis.storeConfig.pterodactyl.url}*
📧 Email: *${order.serverDetails.email}*
🔑 Password: Cek email Anda

📝 Server berhasil dibuat dan siap digunakan!
`
        }

        await sock.sendMessage(m.chat, { text: statusMessage }, { quoted: m })

    } catch (error) {
        console.error('Error in order status command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat mengecek status pesanan.'
        }, { quoted: m })
    }
}

export async function myOrdersCmd(sock, m) {
    try {
        const orders = await Order.getByUserId(m.sender)

        if (orders.length === 0) {
            return await sock.sendMessage(m.chat, {
                text: `📭 *TIDAK ADA PESANAN*

Anda belum memiliki pesanan apapun.

💡 Ketik .catalog untuk melihat produk yang tersedia`
            }, { quoted: m })
        }

        const statusEmoji = {
            'pending': '⏳',
            'payment_sent': '📋',
            'confirmed': '✅',
            'completed': '🎉',
            'cancelled': '❌'
        }

        let ordersText = `
📋 *DAFTAR PESANAN ANDA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`

        orders.slice(0, 10).forEach((order, index) => {
            ordersText += `
${index + 1}. ${statusEmoji[order.status]} *${order.id}*
   📦 ${order.productName}
   💰 ${Order.formatPrice(order.price)}
   📅 ${new Date(order.createdAt).toLocaleDateString('id-ID')}

`
        })

        ordersText += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Ketik .order-status [order-id] untuk detail pesanan
`

        await sock.sendMessage(m.chat, { text: ordersText }, { quoted: m })

    } catch (error) {
        console.error('Error in my orders command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat mengambil daftar pesanan.'
        }, { quoted: m })
    }
}

// Admin command to confirm payment
export async function paymentDoneCmd(sock, m) {
    try {
        // Check if user is admin
        if (!globalThis.isStoreAdmin(m.sender)) {
            return await sock.sendMessage(m.chat, {
                text: '❌ Anda tidak memiliki akses untuk menjalankan command ini.'
            }, { quoted: m })
        }
        console.log(m)
        const args = m.message?.conversation?.split(' ') || m.message?.extendedTextMessage?.text?.split(' ')
        if (args.length < 2) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.payment-done [order-id]

📋 *Contoh:*
.payment-done ORD-123456-ABC`
            }, { quoted: m })
        }

        const orderId = args[1]
        const order = await Order.getById(orderId)

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

        // Create pterodactyl account and server
        const pterodactyl = new PterodactylAPI()
        const result = await pterodactyl.createCompleteOrder(order.username, order.productCode)

        if (!result.success) {
            await sock.sendMessage(m.chat, {
                text: `❌ *Gagal membuat server!*

🔍 Error: ${result.error}

💡 Silakan coba lagi atau hubungi developer.`
            }, { quoted: m })
            return
        }

        // Update order status
        await Order.updateStatus(orderId, 'completed', {
            serverId: result.server.attributes.id,
            serverDetails: {
                email: result.credentials.email,
                panelUrl: result.loginUrl,
                serverName: result.server.attributes.name
            }
        })

        // Notify admin
        await sock.sendMessage(m.chat, {
            text: `✅ *PESANAN BERHASIL DIPROSES*

🆔 Order ID: *${orderId}*
👤 Username: *${order.username}*
🖥️ Server ID: *${result.server.attributes.id}*
📧 Email: *${result.credentials.email}*

Server berhasil dibuat dan customer akan diberitahu.`
        }, { quoted: m })

        // Notify customer
        const customerNotif = `
🎉 *PESANAN ANDA TELAH SELESAI!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${orderId}*
📦 Produk: *${order.productName}*

🖥️ *DETAIL AKSES PANEL:*
🌐 URL Panel: *${result.loginUrl}*
📧 Email: *${result.credentials.email}*
👤 Username: *${order.username}*
🔑 Password: *1*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Server Anda sudah siap digunakan!

💡 *Panduan Login:*
1. Buka link panel di atas
2. Login dengan email dan password yang dikirim ke email
3. Server Anda akan muncul di dashboard

🆘 *Butuh bantuan?* Hubungi admin
`

        await sock.sendMessage(order.userId, { text: customerNotif })

    } catch (error) {
        console.error('Error in payment done command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat memproses konfirmasi pembayaran.'
        }, { quoted: m })
    }
}

// Auto-handle payment proof images
export async function handlePaymentProof(sock, m) {
    try {
        // Check if message contains image and user has pending orders
        if (!m.message?.imageMessage) return

        const userOrders = await Order.getByUserId(m.sender)
        const pendingOrder = userOrders.find(order => order.status === 'pending')

        if (!pendingOrder) return

        // Update order with payment proof
        await Order.addPaymentProof(pendingOrder.id, {
            messageId: m.key.id,
            timestamp: new Date().toISOString()
        })

        // Notify user
        await sock.sendMessage(m.chat, {
            text: `✅ *BUKTI PEMBAYARAN DITERIMA*

🆔 Order ID: *${pendingOrder.id}*
📦 Produk: *${pendingOrder.productName}*

📋 Status berubah menjadi: *Menunggu Konfirmasi Admin*

⏰ Pembayaran Anda akan dikonfirmasi dalam 1x24 jam.
💡 Ketik .order-status ${pendingOrder.id} untuk cek status terbaru.`
        }, { quoted: m })

        // Notify admin
        const adminNotif = `
💳 *BUKTI PEMBAYARAN DITERIMA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${pendingOrder.id}*
👤 Customer: *${m.pushName}* (${m.sender})
📦 Produk: *${pendingOrder.productName}*
💰 Harga: *${Order.formatPrice(pendingOrder.price)}*

📸 Customer telah mengirim bukti pembayaran.

✅ Ketik: .payment-done ${pendingOrder.id}
❌ Ketik: .payment-cancel ${pendingOrder.id}
`

        await sock.sendMessage(globalThis.storeConfig.admin.owner + '@s.whatsapp.net', {
            text: adminNotif
        })

    } catch (error) {
        console.error('Error handling payment proof:', error)
    }
}

// Admin command to cancel payment
export async function paymentCancelCmd(sock, m) {
    try {
        // Check if user is admin
        if (!globalThis.isStoreAdmin(m.sender)) {
            return await sock.sendMessage(m.chat, {
                text: '❌ Anda tidak memiliki akses untuk menjalankan command ini.'
            }, { quoted: m })
        }

        const args = m.text.split(' ')
        if (args.length < 2) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Format Salah!*

📝 *Cara penggunaan:*
.payment-cancel [order-id]

📋 *Contoh:*
.payment-cancel ORD-123456-ABC`
            }, { quoted: m })
        }

        const orderId = args[1]
        const order = await Order.getById(orderId)

        if (!order) {
            return await sock.sendMessage(m.chat, {
                text: `❌ *Pesanan tidak ditemukan!*

🔍 Order ID: *${orderId}*`
            }, { quoted: m })
        }

        // Update order status to cancelled
        await Order.updateStatus(orderId, 'cancelled')

        // Notify admin
        await sock.sendMessage(m.chat, {
            text: `❌ *PESANAN DIBATALKAN*

🆔 Order ID: *${orderId}*
👤 Username: *${order.username}*
📦 Produk: *${order.productName}*

Pesanan telah dibatalkan dan customer akan diberitahu.`
        }, { quoted: m })

        // Notify customer
        const customerNotif = `
❌ *PESANAN DIBATALKAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order ID: *${orderId}*
📦 Produk: *${order.productName}*

💬 *Alasan:* Pembayaran tidak valid atau tidak sesuai

💡 Silakan buat pesanan baru dengan pembayaran yang benar.
🛒 Ketik .catalog untuk melihat produk yang tersedia.

🆘 *Butuh bantuan?* Hubungi admin
`

        await sock.sendMessage(order.userId, { text: customerNotif })

    } catch (error) {
        console.error('Error in payment cancel command:', error)
        await sock.sendMessage(m.chat, {
            text: '❌ Terjadi kesalahan saat membatalkan pesanan.'
        }, { quoted: m })
    }
}

const storeCommands = {
    catalog: catalogCmd,
    katalog: catalogCmd,
    order: orderCmd,
    'order-status': orderStatusCmd,
    'my-orders': myOrdersCmd,
    'payment-done': paymentDoneCmd,
    'payment-cancel': paymentCancelCmd
}

export default storeCommands