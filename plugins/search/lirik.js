import axios from 'axios';

export const handler = {
    command: ['lirik', 'lyrics', 'lagu'],
    help: 'Mencari lirik lagu. Gunakan !lirik <judul lagu> atau reply pesan dengan !lirik',
    tags: ['search'],

    async exec({ m, args, sock }) {
        try {
            let query = args;

            // Jika tidak ada query tapi ada reply
            if (!query && m.quoted) {
                query = m.quoted.text || m.quoted.message?.conversation || '';
            }

            // Validasi input
            if (!query) {
                await m.reply(`🎵 *PENCARI LIRIK LAGU*\n\nCara penggunaan:\n1. !lirik <judul lagu>\n2. Reply pesan dengan !lirik\n\nContoh:\n!lirik eureka milik kita\n!lirik bohemian rhapsody\n!lirik imagine dragons believer\n\n API by : api.ryzumi.vip`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses pencarian lirik menggunakan API
            const apiUrl = `https://api.ryzumi.vip/api/search/lyrics?query=${encodeURIComponent(query)}`;
            const { data: results } = await axios.get(apiUrl);

            if (!results || !Array.isArray(results) || results.length === 0) {
                await m.reply(`❌ *Lirik tidak ditemukan*\n\n*Pencarian:* ${query}\n\nCoba dengan kata kunci yang lebih spesifik atau periksa ejaan judul lagu.`);
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });
                return;
            }

            // Ambil hasil pertama (paling relevan)
            const song = results[0];

            // Format durasi
            const formatDuration = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            // Format pesan hasil
            let message = `🎵 *LIRIK LAGU DITEMUKAN*\n\n`;
            message += `🎤 *Judul:* ${song.name}\n`;
            message += `👨‍🎤 *Artis:* ${song.artistName}\n`;
            message += `💿 *Album:* ${song.albumName || 'Unknown'}\n`;
            message += `⏱️ *Durasi:* ${formatDuration(song.duration)}\n`;
            message += `🎼 *Instrumental:* ${song.instrumental ? '✅ Ya' : '❌ Tidak'}\n\n`;
            message += `📝 *LIRIK:*\n`;
            message += `${song.plainLyrics}\n\n`;

            // Jika ada multiple results, tampilkan info tambahan
            if (results.length > 1) {
                message += `ℹ️ *Info:* Ditemukan ${results.length} versi lagu ini. Menampilkan yang paling relevan.\n\n`;
            }

            message += `⏰ *Dicari pada:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim hasil (split jika terlalu panjang)
            if (message.length > 4096) {
                // Split pesan jika terlalu panjang
                const headerMessage = `🎵 *LIRIK LAGU DITEMUKAN*\n\n` +
                    `🎤 *Judul:* ${song.name}\n` +
                    `👨‍🎤 *Artis:* ${song.artistName}\n` +
                    `💿 *Album:* ${song.albumName || 'Unknown'}\n` +
                    `⏱️ *Durasi:* ${formatDuration(song.duration)}\n` +
                    `🎼 *Instrumental:* ${song.instrumental ? '✅ Ya' : '❌ Tidak'}\n`;

                const lyricsMessage = `📝 *LIRIK:*\n${song.plainLyrics}`;

                await m.reply(headerMessage);
                await m.reply(lyricsMessage);
            } else {
                await m.reply(message);
            }

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in lirik command:', error);
            
            let errorMessage = '❌ Gagal mencari lirik!';
            
            if (error.response?.status === 404) {
                errorMessage += '\n\n*Penyebab:* Lirik tidak ditemukan di database.';
            } else if (error.response?.status === 429) {
                errorMessage += '\n\n*Penyebab:* Terlalu banyak permintaan. Coba lagi nanti.';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage += '\n\n*Penyebab:* Tidak dapat terhubung ke server API.';
            } else {
                errorMessage += `\n\n*Error:* ${error.response?.data?.message || error.message}`;
            }

            await m.reply(errorMessage);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};

export default handler;