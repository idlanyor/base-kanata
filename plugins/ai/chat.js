import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(globalThis.apiKey.gemini);

export const handler = {
    command: ['flash', 'ai', 'gemini2'],
    tags: ['ai'],
    help: 'Chat sederhana dengan AI. Gunakan !chat <pesan> atau reply pesan dengan !chat',
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
                await m.reply(`💬 *AI CHAT*\n\nCara penggunaan:\n1. !chat <pesan>\n2. Reply pesan dengan !chat\n\nContoh:\n!chat Halo, siapa kamu?\n!chat Ceritakan tentang teknologi AI\n!chat Buat puisi tentang alam\n\n💡 Fitur:\n• Chat sederhana dengan AI\n• Jawaban dalam bahasa Indonesia\n• Cocok untuk diskusi ringan`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses dengan Gemini AI
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

            const prompt = `Kamu adalah asisten AI yang friendly dan helpful. 

Instruksi:
1. Jawab dalam bahasa Indonesia yang mudah dipahami
2. Gunakan bahasa yang santai tapi sopan
3. Berikan jawaban yang informatif dan bermanfaat
4. Jika diminta membuat puisi, cerita, atau kreatif, buat yang menarik
5. Jika ditanya tentang teknologi, berikan penjelasan yang sederhana
6. Gunakan emoji yang sesuai untuk membuat jawaban lebih hidup

Pesan user: "${message}"

Jawab dengan ramah dan informatif:`;

            const result = await model.generateContent(prompt);
            const response = result.response.text().trim();

            // Format pesan hasil
            let formattedResponse = `💬 *AI CHAT RESPONSE*\n\n`;
            formattedResponse += `👤 *Pesan:* ${message}\n\n`;
            formattedResponse += `🤖 *Jawaban:*\n`;
            formattedResponse += `${response}\n\n`;
            formattedResponse += `⏰ *Dijawab pada:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim hasil (split jika terlalu panjang)
            if (formattedResponse.length > 4096) {
                // Split pesan jika terlalu panjang
                const headerMessage = `💬 *AI CHAT RESPONSE*\n\n` +
                    `👤 *Pesan:* ${message}\n\n` +
                    `🤖 *Jawaban:*\n`;

                await m.reply(headerMessage);
                await m.reply(response);
            } else {
                await m.reply(formattedResponse);
            }

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in chat command:', error);
            
            let errorMessage = '❌ Gagal mendapatkan respons dari AI!';
            
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