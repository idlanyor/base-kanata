import axios from 'axios'

export const handler = {
    command: ['threads', 'td'],
    tags: ['downloader'],
    help: 'Download video from Threads',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format:\n!threads <threads url>')
                return
            }

            if (!args.includes('threads.com')) {
                await m.reply('❌ Invalid URL! Please provide a valid Threads URL')
                return
            }

            // Add waiting reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            // Download video using API
            const encodedUrl = encodeURIComponent(args)
            const response = await axios.get(`https://ytdlpyton.nvlgroup.my.id/threads/download?url=${encodedUrl}`, {
                headers: {
                    'accept': 'application/json'
                }
            })

            if (!response.data.success || !response.data.result.length) {
                throw new Error('Failed to get video URL')
            }

            await m.reply('📥 Video sedang dikirim...')

            // Send video file
            await sock.sendMessage(m.chat, {
                video: {
                    url: response.data.result[0]
                },
                caption: '✅ Downloaded using Kanata Bot'
            })

            // Add success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in threads:', error)
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
            await m.reply('❌ Gagal mendownload video')
        }
    }
}

export default handler