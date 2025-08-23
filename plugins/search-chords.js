import axios from 'axios';

export const handler = {
    command: ['chord', 'chords', 'kunci'],
    help: 'Mencari chord/kunci gitar lagu. Gunakan !chord <judul lagu> atau reply pesan dengan !chord',
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
                await m.reply(`🎸 *PENCARI CHORD GITAR*\n\nCara penggunaan:\n1. !chord <judul lagu>\n2. Reply pesan dengan !chord\n\nContoh:\n!chord angin senja\n!chord bohemian rhapsody\n!chord wonderwall\n\nAPI by : api.ryzumi.vip`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses pencarian chord menggunakan API
            const apiUrl = `https://api.ryzumi.vip/api/search/chord?query=${encodeURIComponent(query)}`;
            const { data: result } = await axios.get(apiUrl);

            if (!result || !result.title || !result.chord) {
                await m.reply(`❌ *Chord tidak ditemukan*\n\n*Pencarian:* ${query}\n\nCoba dengan kata kunci yang lebih spesifik atau periksa ejaan judul lagu.`);
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });
                return;
            }

            // Format pesan hasil
            let message = `🎸 *CHORD GITAR DITEMUKAN*\n\n`;
            message += `🎵 *Judul:* ${result.title}\n\n`;
            message += `📝 *CHORD:*\n`;
            message += `${result.chord}\n\n`;
            message += `⏰ *Dicari pada:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim hasil (split jika terlalu panjang)
            if (message.length > 4096) {
                // Split pesan jika terlalu panjang
                const headerMessage = `🎸 *CHORD GITAR DITEMUKAN*\n\n` +
                    `🎵 *Judul:* ${result.title}\n`;

                const chordMessage = `📝 *CHORD:*\n${result.chord}`;

                await m.reply(headerMessage);
                await m.reply(chordMessage);
            } else {
                await m.reply(message);
            }

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in chord command:', error);
            
            let errorMessage = '❌ Gagal mencari chord!';
            
            if (error.response?.status === 404) {
                errorMessage += '\n\n*Penyebab:* Chord tidak ditemukan di database.';
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