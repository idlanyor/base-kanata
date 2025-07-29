import { chatWithAI, analyzeMessage, getAllPluginCommands } from '../../helper/gemini.js';

export const handler = {
    command: ['gemini', 'ai', 'ask', 'tanya'],
    tags: ['ai'],
    help: 'Chat dengan AI Gemini. Gunakan !gemini <pertanyaan> atau reply pesan dengan !gemini',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ m, args, sock }) => {
        try {
            let question = args;

            // Jika tidak ada pertanyaan tapi ada reply
            if (!question && m.quoted) {
                question = m.quoted.text || m.quoted.message?.conversation || '';
            }

            // Validasi input
            if (!question) {
                await m.reply(`🤖 *GEMINI AI CHAT*\n\nCara penggunaan:\n1. !gemini <pertanyaan>\n2. Reply pesan dengan !gemini\n\nContoh:\n!gemini Apa itu artificial intelligence?\n!gemini Jelaskan tentang machine learning\n!gemini Buat puisi tentang teknologi\n\n💡 Tips:\n• Tanyakan hal apapun yang ingin kamu ketahui\n• AI akan menjawab dengan bahasa yang mudah dipahami\n• Bisa untuk diskusi, belajar, atau sekedar ngobrol`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Ambil semua plugin commands untuk context
            const plugins = await getAllPluginCommands();

            // Proses dengan Gemini AI
            const aiResponse = await chatWithAI(question, plugins);

            // Format pesan hasil
            let message = `🤖 *GEMINI AI RESPONSE*\n\n`;
            message += `👤 *Pertanyaan:* ${question}\n\n`;
            message += `🤖 *Jawaban:*\n`;
            message += `${aiResponse}\n\n`;
            message += `⏰ *Dijawab pada:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim hasil (split jika terlalu panjang)
            if (message.length > 4096) {
                // Split pesan jika terlalu panjang
                const headerMessage = `🤖 *GEMINI AI RESPONSE*\n\n` +
                    `👤 *Pertanyaan:* ${question}\n\n` +
                    `🤖 *Jawaban:*\n`;

                const responseMessage = `${aiResponse}`;

                await m.reply(headerMessage);
                await m.reply(responseMessage);
            } else {
                await m.reply(message);
            }

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in gemini command:', error);
            
            let errorMessage = '❌ Gagal mendapatkan respons dari Gemini AI!';
            
            if (error.message.includes('API key')) {
                errorMessage += '\n\n*Penyebab:* API key Gemini tidak valid atau tidak ditemukan.';
            } else if (error.message.includes('network')) {
                errorMessage += '\n\n*Penyebab:* Masalah koneksi jaringan. Coba lagi nanti.';
            } else if (error.message.includes('rate limit')) {
                errorMessage += '\n\n*Penyebab:* Terlalu banyak permintaan. Coba lagi dalam beberapa menit.';
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