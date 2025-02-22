export const handler = {
    command: ['bc', 'broadcast'],
    tags: ['owner'],
    help: 'Broadcast pesan ke semua chat',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: true,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format: !bc <pesan>')
                return
            }

            // Dapatkan semua chat
            const chats = Object.values(await sock.chats)
            let successCount = 0
            let failCount = 0

            // Kirim pesan broadcast ke semua chat
            for (let chat of chats) {
                try {
                    await m.reply(`*BROADCAST MESSAGE*\n\n${args}`, false)
                    successCount++
                    // Delay 1 detik untuk menghindari spam
                    await new Promise(resolve => setTimeout(resolve, 1000))
                } catch (err) {
                    console.error(`Gagal broadcast ke ${chat.id}:`, err)
                    failCount++
                }
            }

            await m.reply(`✅ Broadcast selesai!\n\n*Berhasil:* ${successCount} chat\n*Gagal:* ${failCount} chat`)

        } catch (error) {
            console.error('Error in broadcast:', error)
            await m.reply('❌ Gagal melakukan broadcast')
        }
    }
}

export default handler