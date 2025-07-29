import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: globalThis.apiKey.groq });

export const handler = {
    command: ['llama', 'llamaai', 'llama4'],
    tags: ['ai'],
    help: 'Chat dengan Llama AI (Groq). Gunakan !llama <pesan> atau reply pesan dengan !llama',
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
                await m.reply(`🦙 *LLAMA AI (Groq)*\n\nCara penggunaan:\n1. !llama <pesan>\n2. Reply pesan dengan !llama\n\nContoh:\n!llama Apa itu Llama AI?\n!llama Buatkan puisi tentang teknologi\n!llama Jelaskan tentang machine learning`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses dengan Groq Llama-4
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'Kamu adalah Kanata Bot, asisten AI berbasis Llama-4 yang ramah, informatif, dan selalu menjawab dalam bahasa Indonesia. Sertakan emoji jika sesuai.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                temperature: 1,
                max_completion_tokens: 1024,
                top_p: 1,
                stream: false,
                stop: null
            });

            const response = chatCompletion.choices[0].message.content.trim();

            // Format pesan hasil
            let formattedResponse = `🦙 *LLAMA AI RESPONSE*\n\n`;
            formattedResponse += `👤 *Pesan:* ${message}\n\n`;
            formattedResponse += `🤖 *Jawaban:*
${response}\n\n`;
            formattedResponse += `⏰ *Dijawab pada:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim hasil (split jika terlalu panjang)
            if (formattedResponse.length > 4096) {
                const headerMessage = `🦙 *LLAMA AI RESPONSE*\n\n` +
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
            console.error('Error in llama-ai command:', error);
            let errorMessage = '❌ Gagal mendapatkan respons dari Llama AI!';
            if (error.message?.includes('API key')) {
                errorMessage += '\n\n*Penyebab:* API key Groq tidak valid atau tidak ditemukan.';
            } else if (error.message?.includes('network')) {
                errorMessage += '\n\n*Penyebab:* Masalah koneksi jaringan. Coba lagi nanti.';
            } else if (error.message?.includes('rate limit')) {
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