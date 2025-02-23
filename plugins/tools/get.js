export const handler = {
    command: ['get'],
    tags: ['tools'],
    help: 'Mengambil data dari URL\n*Contoh:* !get https://api.example.com/data',
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply('❌ Masukkan URL yang valid\n*Contoh:* !get https://api.example.com/data');
                return;
            }

            const url = args;
            
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            const response = await fetch(url);
            const contentType = response.headers.get('content-type');
            const fileName = url.split('/').pop() || 'file';

            // Handle berbagai tipe media
            if (contentType.includes('image')) {
                const buffer = await response.arrayBuffer();
                await sock.sendMessage(m.chat, { 
                    image: Buffer.from(buffer),
                    caption: '☑️ Response 200 OK ☑️',
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
            else if (contentType.includes('video')) {
                const buffer = await response.arrayBuffer();
                await sock.sendMessage(m.chat, { 
                    video: Buffer.from(buffer),
                    caption: '☑️ Response 200 OK ☑️',
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
            else if (contentType.includes('audio')) {
                const buffer = await response.arrayBuffer();
                await sock.sendMessage(m.chat, { 
                    audio: Buffer.from(buffer),
                    mimetype: 'audio/mp4',
                    fileName: `${fileName}.mp3`,
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
            else if (contentType.includes('application') || contentType.includes('text/csv')) {
                const buffer = await response.arrayBuffer();
                await sock.sendMessage(m.chat, { 
                    document: Buffer.from(buffer),
                    mimetype: contentType,
                    fileName: fileName,
                    caption: `🛜 *GET Request - Document*\n📃 *Type:* ${contentType}`,
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
            else {
                // Handle JSON atau text seperti sebelumnya
                const data = await response.text();
                try {
                    // Coba parse sebagai JSON
                    const jsonData = JSON.parse(data);
                    await m.reply({
                        text: `🛜 *GET Request*\n\n📃 *Response:*\n${JSON.stringify(jsonData, null, 2)}`,
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
                    // Jika bukan JSON, kirim sebagai text biasa
                    await m.reply({
                        text: `🛜 *GET Request*\n\n📃 *Response:*\n${data}`,
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
            }

            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in get:', error);
            await m.reply('❌ Gagal melakukan request GET');
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
} 