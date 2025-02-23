export const handler = {
    command: ['qw', 'qwen'],
    tags: ['ai'],
    help: 'Bertanya kepada Qwen AI\n*Contoh:* !qw Siapa presiden Indonesia?',
    exec: async ({ sock, m, args }) => {
        try {
            if (!args[0]) {
                await m.reply('❌ Masukkan pertanyaan!\n*Contoh:* !qw Siapa presiden Indonesia?');
                return;
            }

            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            const question = encodeURIComponent(args.join(' '));
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
                            body: `Question: ${args.join(' ')}`,
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
            console.error('Error in qwen:', error);
            await m.reply('❌ Terjadi kesalahan saat berkomunikasi dengan Qwen AI');
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}