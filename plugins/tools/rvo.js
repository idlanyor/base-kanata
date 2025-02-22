export const handler = {
    command: ['rvo'],
    tags: ['tools'], 
    help: 'Membaca pesan view once',
    exec: async ({ sock, m }) => {
        try {
            if (!m.quoted) {
                await m.reply('❌ Reply pesan view once untuk membacanya');
                return;
            }

            const quotedMsg = m.quoted.message;
            const vo = quotedMsg?.viewOnceMessageV2?.message;
            
            if (!vo) {
                await m.reply('❌ Pesan yang di-reply bukan view once');
                return;
            }

            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            const media = await m.quoted.download();
            const isImage = vo?.imageMessage;
            const isVideo = vo?.videoMessage;
            const caption = isImage ? isImage.caption : isVideo?.caption;

            const messageContent = {
                [isImage ? 'image' : 'video']: media,
                caption: caption || '📸 View Once Media',
                contextInfo: {
                    externalAdReply: {
                        title: '乂 View Once Reader 乂',
                        body: 'Sonata Bot',
                        thumbnailUrl: 'https://s6.imgcdn.dev/YYoFZh.jpg',
                        sourceUrl: 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            };

            await sock.sendMessage(m.chat, messageContent, { quoted: m });

            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in rvo:', error);
            await m.reply('❌ Gagal membaca pesan view once');
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}

export default handler;