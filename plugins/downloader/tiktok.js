import { tiktokDl } from '../../lib/scraper/tiktok.js';

export const handler = {
    command: ['tiktok', 'tt'],
    help: 'Mendownload video TikTok. Gunakan !tiktok <url> atau reply pesan dengan !tiktok\n\nFlag:\n--audio : Download audio saja',
    tags: ['downloader'],
    
    async exec({ m, args, sock }) {
        try {
            let url = args;
            let isAudioOnly = false;
            
            // Cek flag --audio
            if (typeof args === 'string') {
                if (args.includes('--audio')) {
                    isAudioOnly = true;
                    url = args.replace('--audio', '').trim();
                }
            } else if (Array.isArray(args)) {
                if (args.includes('--audio')) {
                    isAudioOnly = true;
                    url = args.filter(arg => arg !== '--audio').join(' ');
                }
            }
            
            // Jika tidak ada URL tapi ada reply
            if (!url && m.quoted) {
                url = m.quoted.text || m.quoted.message?.conversation || '';
            }
            
            // Validasi input
            if (!url) {
                await m.reply(`📱 *TIKTOK DOWNLOADER*\n\nCara penggunaan:\n1. !tiktok <url>\n2. Reply pesan dengan !tiktok\n\nFlag:\n--audio : Download audio saja\n\nContoh:\n!tiktok https://www.tiktok.com/@user/video/1234567890\n!tiktok --audio https://www.tiktok.com/@user/video/1234567890`);
                return;
            }
            
            // Validasi URL
            if (!url.includes('tiktok.com')) {
                await m.reply('❌ URL tidak valid! URL harus dari TikTok.');
                return;
            }
            
            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });
            
            // Proses download
            const result = await tiktokDl(url);
            
            if (!result.status) {
                throw new Error(result.message || 'Gagal mendapatkan video TikTok');
            }
            
            // Format caption
            let caption = `📱 *TIKTOK DOWNLOADER*\n\n` +
                         `*Author:* ${result.data.author}\n` +
                         `*Caption:* ${result.data.caption}\n\n`;
            
            if (isAudioOnly) {
                // Download audio saja
                if (result.data.audio) {
                    await sock.sendMessage(m.chat, {
                        audio: { url: result.data.audio },
                        mimetype: 'audio/mpeg',
                        caption: caption
                    });
                } else {
                    throw new Error('Audio tidak tersedia');
                }
            } else {
                // Download video (ambil kualitas terbaik)
                if (result.data.video && result.data.video.length > 0) {
                    // Ambil video dengan kualitas terbaik (biasanya yang terakhir)
                    const bestVideo = result.data.video[result.data.video.length - 1];
                    await sock.sendMessage(m.chat, {
                        video: { url: bestVideo.url },
                        caption: caption
                    });
                } else {
                    throw new Error('Video tidak tersedia');
                }
            }
            
            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
            
        } catch (error) {
            console.error('Error in tiktok command:', error);
            await m.reply(`❌ Error: ${error.message}`);
            
            // Tambahkan reaksi error
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}; 