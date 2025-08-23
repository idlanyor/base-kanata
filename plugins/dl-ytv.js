import axios from 'axios'
import yts from 'yt-search'

export const handler = {
    command: ['ytv','yd', 'playv'],
    tags: ['downloader'],
    help: 'Download video YouTube',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format:\n1. !playv <search query>\n2. !playv <youtube url>')
                return
            }

            // Add waiting reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            let videoUrl = ''
            // Check if args is a URL or search query
            if (args.startsWith('https://')) {
                videoUrl = args
            } else {
                // Search using yt-search
                const searchResults = await yts(args)
                if (!searchResults.videos.length) {
                    await sock.sendMessage(m.chat, {
                        react: { text: '❌', key: m.key }
                    })
                    await m.reply('❌ Video tidak ditemukan')
                    return
                }
                videoUrl = searchResults.videos[0].url
            }

            // Download video using new API
            const encodedUrl = encodeURIComponent(videoUrl)
            const response = await axios.get(`https://ytdlpyton.nvlgroup.my.id/download/?url=${encodedUrl}&resolution=480&mode=url`, {
                headers: {
                    'accept': 'application/json',
                    'X-API-Key': globalThis.apiKey.ytdl
                }
            })

            if (!response.data.download_url) {
                throw new Error('Download URL not found')
            }

            await m.reply(`🎥 *${response.data.title}*\n\nVideo sedang dikirim...`)

            // Send video file with thumbnail
            await sock.sendMessage(m.chat, {
                video: {
                    url: response.data.download_url
                },
                caption: `${response.data.title}\n\n⏱️ Duration: ${response.data.duration}s\n👤 Uploader: ${response.data.uploader}`,
                thumbnail: response.data.thumbnail
            })

            // Add success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in playv:', error)
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
            await m.reply('❌ Gagal mendownload video')
        }
    }
}

export default handler