import axios from 'axios'
export const handler = {
    command: ['play', 'spotify'],
    tags: ['downloader'],
    help: 'Mencari dan memutar lagu dari Spotify\n*Contoh:* !play JKT48 Heavy Rotation',
    exec: async ({ sock, m, args }) => {
        try {
            console.log(args)
            if (!args) {
                await m.reply('🎵 Masukkan judul lagu yang ingin diputar\n*Contoh:* !play JKT48 Heavy Rotation');
                return;
            }

            // Kirim reaksi proses
            await sock.sendMessage(m.chat, { 
                react: { text: '🔍', key: m.key }
            });

            // Mencari lagu
            await m.reply(`🔍 Sedang mencari *${args}* di Spotify...`);
            
            const { thumbnail, title, author, audio } = await spotifySong(args);
            if (!audio) {
                throw new Error('Lagu tidak ditemukan atau tidak bisa diunduh');
            }

            // Kirim thumbnail dan info
            await m.reply({
                text: `🎧 *SPOTIFY PLAY*

🎵 *Judul:* ${title}
👤 *Artis:* ${author}

_Sedang mengirim audio, mohon tunggu..._`,
                contextInfo: {
                    externalAdReply: {
                        title: '乂 Spotify Downloader 乂',
                        body: `${title} - ${author}`,
                        thumbnailUrl: thumbnail,
                        sourceUrl: 'https://open.spotify.com',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });

            // Kirim audio
            await sock.sendMessage(m.chat, { 
                audio: { url: audio }, 
                mimetype: 'audio/mpeg', 
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: author,
                        thumbnailUrl: thumbnail,
                        sourceUrl: 'https://open.spotify.com',
                        mediaType: 1,
                    }
                }
            }, { quoted: m });

            // Kirim reaksi sukses
            await sock.sendMessage(m.chat, { 
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in spotify play:', error);
            await m.reply('❌ Gagal mengunduh lagu. Silakan coba lagi nanti.');
            
            // Kirim reaksi error
            await sock.sendMessage(m.chat, { 
                react: { text: '❌', key: m.key }
            });
        }
    }
}

// Fungsi untuk mencari dan mengunduh lagu dari Spotify
async function spotifySong(query) {
    try {
        // Cari URL Spotify
        const { data: searchData } = await axios.get('https://fastrestapis.fasturl.cloud/music/spotify', {
            params: { name: query }
        });
        
        if (!searchData?.result?.[0]?.url) {
            throw new Error('Lagu tidak ditemukan');
        }

        // Unduh lagu dari URL Spotify
        const { data: songData } = await axios.get('https://roy.sirandu.icu/api/spotify', {
            params: { url: searchData.result[0].url }
        });

        if (!songData?.result?.downloadMp3) {
            throw new Error('Gagal mengunduh lagu');
        }

        return {
            thumbnail: songData.result.coverImage || `${globalThis.ppUrl}`,
            title: songData.result.title || query,
            author: songData.result.artist || 'Unknown Artist',
            audio: songData.result.downloadMp3
        };

    } catch (error) {
        console.error('Error in spotifySong:', error);
        throw error;
    }
}

export default handler; 