export const handler = {
    command: ['post'],
    tags: ['tools'],
    help: 'Mengirim data ke URL\n*Contoh:* !post https://api.example.com/data {"key":"value"}',
    exec: async ({ sock, m, args }) => {
        try {
            if (!args[0] || !args[1]) {
                await m.reply('❌ Format salah\n*Contoh:* !post https://api.example.com/data {"key":"value"}');
                return;
            }

            const url = args[0];
            const data = args.slice(1).join(' ');
            
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            let jsonData;
            try {
                jsonData = JSON.parse(data);
            } catch {
                await m.reply('❌ Data harus dalam format JSON yang valid');
                return;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });

            const responseData = await response.text();
            
            try {
                // Coba parse sebagai JSON
                const jsonResponse = JSON.parse(responseData);
                await m.reply({
                    text: `🌐 *POST Request*\n\n📤 *Data:*\n${JSON.stringify(jsonData, null, 2)}\n\n📥 *Response:*\n${JSON.stringify(jsonResponse, null, 2)}`,
                    contextInfo: {
                        externalAdReply: {
                            title: '乂 API Request 乂',
                            body: url,
                            thumbnailUrl: `${globalThis.ppUrl}`,
                            sourceUrl: url,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            } catch {
                await m.reply({
                    text: `🌐 *POST Request*\n\n📤 *Data:*\n${JSON.stringify(jsonData, null, 2)}\n\n📥 *Response:*\n${responseData}`,
                    contextInfo: {
                        externalAdReply: {
                            title: '乂 API Request 乂',
                            body: url,
                            thumbnailUrl: `${globalThis.ppUrl}`,
                            sourceUrl: url,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            }

            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in post:', error);
            await m.reply('❌ Gagal melakukan request POST');
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
} 