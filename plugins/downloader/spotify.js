import axios from 'axios'
import { spotifyDownload } from '../../lib/scraper/spotify.js';
export const handler = {
    command: ['play', 'spotify'],
    tags: ['downloader'],
    help: 'Mencari dan memutar lagu dari Spotify\n*Contoh:* !play JKT48 Heavy Rotation',
    exec: async ({ sock, m, args }) => {
        try {
            console.log(args)
            if (!args || args.length === 0) {
                await m.reply('🎵 Masukkan judul lagu yang ingin diputar\n*Contoh:* !play JKT48 Heavy Rotation');
                return;
            }

            // Kirim reaksi proses
            await sock.sendMessage(m.chat, { 
                react: { text: '🔍', key: m.key }
            });

            // Mencari lagu
            const { thumbnail, title, author, audio } = await spotifySong(args);
            if (!audio) {
                await m.reply('❌ Lagu tidak ditemukan atau tidak bisa diunduh');
                return;
            }

            // Kirim thumbnail dan info serta audio dalam satu pesan
            const messageText = `🎧 *SPOTIFY PLAY*

🎵 *Judul:* ${title}
👤 *Artis:* ${author}

_Sedang mengirim audio, mohon tunggu..._`;

            await sock.sendMessage(m.chat, { 
                text: messageText,
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

        // Unduh lagu dari URL Spotify menggunakan spotifyDownload
        const songData = await spotifyDownload(searchData.result[0].url);

        // if (!songData.status || !songData.data.downloadUrl) {
        //     throw new Error('Gagal mengunduh lagu');
        // }

        return {
            thumbnail: songData.data.coverImage || `${globalThis.ppUrl}`,
            title: songData.data.title || query,
            author: songData.data.artist || 'Unknown Artist',
            audio: songData.data.downloadUrl
        };

    } catch (error) {
        console.error('Error in spotifySong:', error);
        throw error;
    }
}

export default handler; 