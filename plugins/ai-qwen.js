export const handler = {
    command: ['qw'],
    help: 'Bertanya ke Qwen AI\n\nCara penggunaan:\n!qw <pertanyaan>\n\nContoh:\n!qw Siapa presiden Indonesia?',
    tags: ['tools'],
    
    async exec({ m, args, sock }) {
        try {
            if (!args[0]) {
                await m.reply('❌ Masukkan pertanyaan!\n*Contoh:* !qw Siapa presiden Indonesia?');
                return;
            }

            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            const question = encodeURIComponent(args);
            const style = encodeURIComponent('Selalu Balas saya dalam bahasa indonesia,dengan bahasa yang nonformal dan penuh emote ceria');
            const url = `https://fastrestapis.fasturl.cloud/aillm/superqwen?ask=${question}&style=${style}&sessionId=${m.chat}&model=qwen-max-latest&mode=search`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'accept': 'application/json'
                }
            });

            const data = await response.json();

            if (data.status === 200) {
                await m.reply({
                    text: `🤖 *QWEN AI*\n\n${data.result}`,
                    contextInfo: {
                        externalAdReply: {
                            title: '乂 Qwen AI 乂',
                            body: `Question: ${args}`,
                            thumbnailUrl: 'https://s6.imgcdn.dev/YYoFZh.jpg',
                            sourceUrl: `${globalThis.newsletterUrl}`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });

                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                });
            } else {
                throw new Error('Gagal mendapatkan respons dari AI');
            }

        } catch (error) {
            console.error('Error in qw:', error);
            await m.reply('❌ Terjadi kesalahan saat berkomunikasi dengan Qwen AI');
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}; 