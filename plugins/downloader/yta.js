import axios from 'axios'
import yts from 'yt-search'

export const handler = {
    command: ['play', 'yta'],
    tags: ['downloader'],
    help: 'Download video YouTube',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format:\n1. !play <search query>\n2. !play <youtube url>')
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
                await m.reply(`🎵 Ditemukan: ${searchResults.videos[0].title}`)
            }

            // Download audio using API
            const response = await axios.post('https://ytdlp.antidonasi.web.id/download/audio', {
                url: videoUrl
            })

            if (response.data.error) {
                throw new Error(response.data.error)
            }

            await m.reply(`🎵 *${response.data.title}*\n\nAudio sedang dikirim...`)
            
            // Send audio file
            await sock.sendMessage(m.chat, {
                audio: {
                    url: response.data.url
                },
                mimetype: 'audio/mpeg',
                fileName: `${response.data.title}.mp3`
            })

            // Add success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in play:', error)
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
            await m.reply('❌ Gagal mendownload audio')
        }
    }
}

export default handler