import yts from 'yt-search'
export const handler = {
    command: ['yts', 'ytsearch'],
    tags: ['downloader'],
    help: 'Mencari video di YouTube\n\nFormat: !yts <query>',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format: !yts <query>\nContoh: !yts Lagu Indonesia')
                return
            }

            await sock.sendMessage(m.chat, {
                react: { text: '🔍', key: m.key }
            })

            const searchResults = await yts(args)
            
            if (!searchResults.videos.length) {
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                })
                await m.reply('❌ Video tidak ditemukan')
                return
            }

            const videos = searchResults.videos.slice(0, 5)

            let result = '*🎥 YouTube Search Results*\n\n'
            videos.forEach((video, i) => {
                result += `*${i + 1}. ${video.title}*\n`
                result += `👤 Channel: ${video.author.name}\n`
                result += `⏱️ Duration: ${video.timestamp}\n`
                result += `👁️ Views: ${video.views.toLocaleString()}\n`
                result += `📅 Upload: ${video.ago}\n`
                result += `🔗 URL: ${video.url}\n\n`
            })
            
            result += `\n📝 Untuk mendownload video:\n`
            result += `📺 Video: ketik !playv <url>\n`
            result += `🎵 Audio: ketik !play <url>`

            await m.reply(result)

            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in yts:', error)
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
            await m.reply('❌ Gagal mencari video: ' + error.message)
        }
    }
}

export default handler