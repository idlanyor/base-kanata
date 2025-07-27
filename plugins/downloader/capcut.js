import { capcutDl } from '../../lib/scraper/capcut.js';

export const handler = {
    command: ['capcut', 'cc'],
    help: 'Download template CapCut. Gunakan !capcut <url> atau reply pesan dengan !capcut',
    tags: ['downloader'],

    async exec({ m, args, sock }) {
        try {
            let url = args;

            // Jika tidak ada URL tapi ada reply
            if (!url && m.quoted) {
                url = m.quoted.text || m.quoted.message?.conversation || '';
            }

            // Validasi input
            if (!url) {
                await m.reply(`🎬 *CAPCUT DOWNLOADER*\n\nCara penggunaan:\n1. !capcut <url>\n2. Reply pesan dengan !capcut\n\nContoh:\n!capcut https://www.capcut.com/t/Zs8yP9ycY/`);
                return;
            }

            // Validasi URL
            if (!url.includes('capcut.com')) {
                await m.reply('❌ URL tidak valid! URL harus dari CapCut.');
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses download
            const result = await capcutDl(url);

            if (!result.status) {
                throw new Error(result.message || 'Gagal mendapatkan informasi template');
            }

            // Format pesan hasil
            const response = `🎬 *CAPCUT DOWNLOADER*\n\n` +
                `*Judul:* ${result.data.title}\n` +
                `*Deskripsi:* ${result.data.description}\n\n`;

            // Kirim thumbnail jika ada
            if (result.data.downloadUrl) {
                await sock.sendMessage(m.chat, {
                    video: { url: result.data.downloadUrl },
                    caption: response
                });
            } else {
                await m.reply(response);
            }

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in capcut command:', error);
            await m.reply(`❌ Error: ${error.message}`);

            // Tambahkan reaksi error
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};