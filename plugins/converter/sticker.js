import { createSticker, StickerTypes } from "wa-sticker-formatter"

export const handler = {
    command: ['sticker', 's'],
    tags: ['converter'],
    help: 'Membuat sticker dari gambar/video',
    exec: async ({ sock, m }) => {
        try {
            let media = null;
            
            if (m.quoted) {
                if (!['image', 'video'].includes(m.quoted.type)) {
                    await sock.sendMessage(m.chat, { text: '❌ Reply gambar/video untuk dijadikan sticker' }, { quoted: m });
                    return;
                }
                media = await m.quoted.download();
            } else if (['image', 'video'].includes(m.type)) {
                media = await m.download();
            } else {
                await sock.sendMessage(m.chat, { text: '❌ Kirim/reply gambar/video dengan caption !sticker' }, { quoted: m });
                return;
            }

            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            let stickerOptions = {
                pack: 'Kanata Bot',
                author: 'V2', 
                quality: 100,
                type: m.type === 'video' ? StickerTypes.CROPPED : StickerTypes.FULL
            }

            const sticker = await createSticker(media, stickerOptions);

            await sock.sendMessage(m.chat, { sticker }, { quoted: m });

            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in sticker:', error);
            await sock.sendMessage(m.chat, { text: '❌ Gagal membuat sticker' }, { quoted: m });
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}

export default handler