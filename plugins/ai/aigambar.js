import FormData from 'form-data';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';

export const handler = {
    command: ['aigambar', 'aiimg', 'visi'],
    tags: ['ai'],
    help: 'Analisis gambar menggunakan AI\n\nFormat: Kirim/Reply gambar dengan caption !aigambar [pertanyaan]',
    
    async exec({ sock, m, args }) {
        try {
            let buffer;
            let question = args || 'gambar apa ini?';

            // Add waiting reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Handle different message types
            if (m.quoted) {
                const quotedMessage = m.quoted.message;
                const messageType = Object.keys(quotedMessage)[0];
                
                if (messageType === 'imageMessage') {
                    buffer = await m.quoted.download();
                } else {
                    throw new Error('Please reply to an image!');
                }
            } else if (m.message && m.message.imageMessage) {
                buffer = await m.download();
            } else {
                await m.reply(`🤖 *AI GAMBAR ANALYZER*\n\nCara penggunaan:\n1. Kirim gambar dengan caption !aigambar [pertanyaan]\n2. Reply gambar dengan !aigambar [pertanyaan]\n\nContoh:\n!aigambar\n!aigambar apa yang ada di gambar ini?\n!aigambar jelaskan detail gambar ini`);
                return;
            }

            if (!buffer) {
                throw new Error('No image detected!');
            }

            // Validate file type
            const fileType = await fileTypeFromBuffer(buffer);
            if (!fileType || !fileType.mime.startsWith('image/')) {
                throw new Error('File harus berupa gambar!');
            }

            // Upload image to catbox.moe first
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buffer, {
                filename: `image.${fileType.ext}`,
                contentType: fileType.mime
            });

            const uploadResponse = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            if (!uploadResponse.data.startsWith('https://')) {
                throw new Error('Gagal upload gambar: ' + uploadResponse.data);
            }

            const imageUrl = uploadResponse.data;

            // Generate session ID
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Call AI API
            const apiUrl = 'https://api.fasturl.link/aillm/gpt-4o';
            const params = {
                ask: question,
                imageUrl: imageUrl,
                style: 'selalu balas percakapan ini dalam bahasa indonesia',
                sessionId: sessionId
            };

            const aiResponse = await axios.get(apiUrl, {
                params: params,
                headers: {
                    'accept': 'application/json',
                    'x-api-key': globalThis.apiKey.fasturl
                }
            });

            if (aiResponse.data.status !== 200) {
                throw new Error('AI API error: ' + (aiResponse.data.content || 'Unknown error'));
            }

            // Format response
            const result = aiResponse.data.result;
            const responseMessage = `🤖 *AI GAMBAR ANALYZER*\n\n` +
                `❓ *Pertanyaan:* ${question}\n\n` +
                `🔍 *Analisis AI:*\n${result}\n\n` +
                `🔗 *Image URL:* ${imageUrl}\n` +
                `⏰ *Dianalisis:* ${new Date().toLocaleString('id-ID')}`;

            await m.reply(responseMessage);

            // Add success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in aigambar:', error);
            
            let errorMessage = '❌ Gagal menganalisis gambar!';
            
            if (error.message.includes('reply to an image')) {
                errorMessage += '\n\n*Penyebab:* Harap reply atau kirim gambar.';
            } else if (error.message.includes('File harus berupa gambar')) {
                errorMessage += '\n\n*Penyebab:* File yang dikirim bukan gambar.';
            } else if (error.message.includes('Gagal upload gambar')) {
                errorMessage += '\n\n*Penyebab:* Gagal mengupload gambar ke server.';
            } else if (error.message.includes('AI API error')) {
                errorMessage += '\n\n*Penyebab:* Error dari AI service.';
            } else {
                errorMessage += `\n\n*Error:* ${error.message}`;
            }

            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
            await m.reply(errorMessage);
        }
    }
};

export default handler;