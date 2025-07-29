import { analyzeMessage, getAllPluginCommands } from '../../helper/gemini.js';

export const handler = {
    command: ['analyze', 'analisis', 'suggest', 'sarankan'],
    tags: ['ai'],
    help: 'Analisis pesan dan sarankan command yang tepat. Gunakan !analyze <pesan> atau reply pesan dengan !analyze',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ m, args, sock }) => {
        try {
            let message = args;

            // Jika tidak ada pesan tapi ada reply
            if (!message && m.quoted) {
                message = m.quoted.text || m.quoted.message?.conversation || '';
            }

            // Validasi input
            if (!message) {
                await m.reply(`🔍 *AI MESSAGE ANALYZER*\n\nCara penggunaan:\n1. !analyze <pesan>\n2. Reply pesan dengan !analyze\n\nContoh:\n!analyze download video tiktok\n!analyze convert audio ke mp3\n!analyze cari lirik lagu\n\n💡 Fitur:\n• Analisis pesan dan sarankan command yang tepat\n• Berikan penjelasan mengapa command tersebut cocok\n• Sertakan parameter yang dibutuhkan`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Ambil semua plugin commands
            const plugins = await getAllPluginCommands();

            // Analisis pesan dengan AI
            const analysis = await analyzeMessage(message, plugins);

            // Format hasil analisis
            let response = `🔍 *AI MESSAGE ANALYSIS*\n\n`;
            response += `📝 *Pesan:* ${message}\n\n`;

            if (analysis.command === "NO_COMMAND") {
                response += `❌ *Hasil Analisis:*\n`;
                response += `Tidak ada command yang cocok untuk pesan ini.\n\n`;
                response += `💡 *Saran:*\n`;
                response += `• Gunakan prefix "!" untuk menjalankan command\n`;
                response += `• Ketik "!help" untuk melihat daftar command\n`;
                response += `• Atau gunakan "!gemini" untuk chat dengan AI\n\n`;
                response += `🔍 *Alasan:* ${analysis.reason || 'Pesan tidak mengandung command yang jelas'}`;
            } else {
                response += `✅ *Command yang Disarankan:*\n`;
                response += `• Command: !${analysis.command}\n`;
                response += `• Parameter: ${analysis.args || 'Tidak ada parameter'}\n`;
                response += `• Confidence: ${(analysis.confidence * 100).toFixed(1)}%\n\n`;

                // Tambahkan info command jika ada
                const commandInfo = plugins[analysis.command.toLowerCase()];
                if (commandInfo) {
                    response += `📋 *Info Command:*\n`;
                    response += `• Deskripsi: ${commandInfo.help || 'Tidak ada deskripsi'}\n`;
                    response += `• Tags: ${commandInfo.tags?.join(', ') || 'Tidak ada tag'}\n\n`;
                }

                response += `💡 *Cara Penggunaan:*\n`;
                response += `!${analysis.command} ${analysis.args || ''}`;
            }

            response += `\n\n⏰ *Dianalisis pada:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim hasil
            await m.reply(response);

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in analyze command:', error);
            
            let errorMessage = '❌ Gagal menganalisis pesan!';
            
            if (error.message.includes('API key')) {
                errorMessage += '\n\n*Penyebab:* API key Gemini tidak valid atau tidak ditemukan.';
            } else if (error.message.includes('network')) {
                errorMessage += '\n\n*Penyebab:* Masalah koneksi jaringan. Coba lagi nanti.';
            } else {
                errorMessage += `\n\n*Error:* ${error.message}`;
            }

            await m.reply(errorMessage);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};

export default handler; 