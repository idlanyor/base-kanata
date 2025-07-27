import { mediafire } from '../../lib/scraper/mediafire.js';

export const handler = {
    command: ['mediafire', 'mf', 'mfire'],
    help: 'Mendownload file dari Mediafire. Gunakan !mediafire <url> atau reply pesan dengan !mediafire',
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
                await m.reply(`📥 *MEDIAFIRE DOWNLOADER*\n\nCara penggunaan:\n1. !mediafire <url>\n2. Reply pesan dengan !mediafire\n\nContoh:\n!mediafire https://www.mediafire.com/file/xxx/file`);
                return;
            }

            // Validasi URL
            if (!url.includes('mediafire.com')) {
                await m.reply('❌ URL tidak valid! URL harus dari Mediafire.');
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses download
            const result = await mediafire(url);

            if (!result.status) {
                await m.reply(`❌ *Gagal mengambil file Mediafire*\n\n*Pesan:* ${result.message}\n*Error:* ${result.error || '-'}\n`);
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });
                return;
            }

            // Format pesan hasil
            const response = `📥 *MEDIAFIRE DOWNLOADER*\n\n` +
                `*Nama File:* ${result.data.filename}\n` +
                `*Ukuran:* ${result.data.filesize}\n`;

            await sock.sendMessage(m.chat, {
                document: { url: result.data.downloadUrl },
                fileName: result.data.filename,
                mimetype: 'application/octet-stream',
                caption: response
            }, { quoted: m });

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in mediafire command:', error);
            await m.reply(`❌ Error: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};