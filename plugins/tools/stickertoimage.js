import { downloadMediaMessage } from 'baileys'

export const handler = {
    command: ['toimg', 'stimg'],
    tags: ['converter'],
    help: 'Mengkonversi stiker menjadi gambar\n\nCara pakai:\n1. Reply stiker dengan !toimg\n2. Kirim stiker dengan caption !toimg',
    exec: async ({ sock, m }) => {
        try {
            let quotedMsg
            
            // Check if message is quoted
            if (m.quoted) {
                quotedMsg = m.quoted
            } else if (m.message?.stickerMessage) {
                quotedMsg = m
            } else {
                await m.reply('❌ Reply stiker yang ingin dikonversi ke gambar!')
                return
            }

            // Validate if it's a sticker
            if (!quotedMsg.message?.stickerMessage) {
                await m.reply('❌ Pesan yang di-reply bukan stiker!')
                return
            }

            // Add waiting reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            // Download sticker buffer
            const buffer = await downloadMediaMessage(
                quotedMsg,
                'buffer',
                {},
                { logger: console }
            )

            // Get sticker info
            const stickerInfo = quotedMsg.message.stickerMessage
            const isAnimated = stickerInfo.isAnimated || false

            // Send as image
            await sock.sendMessage(m.chat, {
                image: buffer,
                caption: `✨ *Sticker To Image*\n\n${isAnimated ? '🎬 Animated Sticker' : '🖼️ Static Sticker'}\n📅 ${new Date().toLocaleDateString('id-ID')}`,
                jpegThumbnail: null
            }, { quoted: m })

            // Add success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in toimg:', error)
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
            await m.reply('❌ Gagal mengkonversi stiker: ' + error.message)
        }
    }
}

export default handler