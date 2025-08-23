import { downloadMediaMessage } from 'baileys'

export const handler = {
    command: ['readvo', 'rvo'],
    tags: ['tools'],
    help: 'Membaca pesan view once\n\nFormat: Reply pesan view once dengan !readvo',
    isAdmin: false,
    isBotAdmin: false,
    isGroup: false,
    exec: async ({ sock, m }) => {
        try {
            // Check if message is quoted
            if (!m.quoted) {
                await m.reply('❌ Reply pesan view once yang ingin dibuka!')
                return
            }

            // Get view once message
            const ViewOnceImg = m.quoted?.message?.imageMessage
            const ViewOnceVid = m.quoted?.message?.videoMessage
            // console.log(m.quoted)
            // return
            if (!ViewOnceImg.viewOnce && !ViewOnceVid.viewOnce) {
                await m.reply('❌ Pesan yang di-reply bukan view once!')
                return
            }

            // Add waiting reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            // Download the media
            const buffer = await downloadMediaMessage(
                m.quoted,
                'buffer',
                {},
                { logger: console }
            )

            // Send media based on type
            if (ViewOnceImg) {
                await sock.sendMessage(m.chat, {
                    image: buffer,
                    caption: ViewOnceImg.caption || '',
                    jpegThumbnail: null
                }, { quoted: m })
            } else {
                await sock.sendMessage(m.chat, {
                    video: buffer,
                    caption: ViewOnceVid.caption || '',
                    jpegThumbnail: null
                }, { quoted: m })
            }

            // Add success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in readvo:', error)
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
            await m.reply('❌ Gagal membuka pesan view once: ' + error.message)
        }
    }
}

export default handler