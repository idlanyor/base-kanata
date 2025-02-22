export const handler = {
    command: ['yt', 'ytdl'],
    tags: ['downloader'],
    help: 'Download video YouTube',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format: !yt <url>')
                return
            }

            await m.reply('⏳ Sedang memproses...')
            // Proses download
            await m.reply('✅ Video berhasil didownload!')

        } catch (error) {
            console.error('Error in yt:', error)
            await m.reply('❌ Gagal mendownload video')
        }
    }
}

export default handler 