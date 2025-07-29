import axios from 'axios';

export const handler = {
    command: ['npmjs', 'npmpkg', 'npmsearch'],
    help: 'Cari package di npmjs. Gunakan !npmjs <nama package> atau keyword.',
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
                await m.reply(`📦 *PENCARI PACKAGE NPMJS*\n\nCara penggunaan:\n1. !npmjs <nama/keyword>\n2. Reply pesan dengan !npmjs\n\nContoh:\n!npmjs axios\n!npmjs whatsapp bot\n!npmjs express`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Pencarian ke registry npmjs
            const apiUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`;
            const { data } = await axios.get(apiUrl);

            if (!data.objects || data.objects.length === 0) {
                await m.reply(`❌ *Package tidak ditemukan*\n\n*Pencarian:* ${query}\n\nCoba dengan kata kunci lain atau periksa ejaan.`);
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });
                return;
            }

            // Format hasil
            let message = `📦 *HASIL PENCARIAN NPMJS*\n\n`;
            data.objects.forEach((obj, i) => {
                const pkg = obj.package;
                message += `*${i + 1}. ${pkg.name}* (${pkg.version})\n`;
                message += pkg.description ? `📝 ${pkg.description}\n` : '';
                message += pkg.links?.npm ? `🔗 [npmjs](${pkg.links.npm})\n` : '';
                message += pkg.links?.homepage ? `🏠 [homepage](${pkg.links.homepage})\n` : '';
                message += pkg.links?.repository ? `📁 [repo](${pkg.links.repository})\n` : '';
                message += pkg.keywords && pkg.keywords.length ? `🏷️ ${pkg.keywords.join(', ')}\n` : '';
                message += pkg.date ? `📅 Update: ${new Date(pkg.date).toLocaleDateString('id-ID')}\n` : '';
                message += '\n';
            });
            message += `⏰ Dicari pada: ${new Date().toLocaleString('id-ID')}`;

            await m.reply(message);
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Error in npmjs command:', error);
            let errorMessage = '❌ Gagal mencari package npmjs!';
            if (error.response?.status === 429) {
                errorMessage += '\n\n*Penyebab:* Terlalu banyak permintaan. Coba lagi nanti.';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage += '\n\n*Penyebab:* Tidak dapat terhubung ke server npmjs.';
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