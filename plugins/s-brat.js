import axios from 'axios'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

export const handler = {
    command: ['brat'],
    tags: ['downloader'],
    help: 'Generate gambar/brat text dengan berbagai template dan style.\nContoh: !brat text=Halo template=matrix style=mirror mode=animated fontPosition=top-center',
    exec: async ({ sock, m, args }) => {
        try {
            // Parsing argumen
            let params = {
                mode: 'image',
                template: '-',
                style: 'basic',
                fontPosition: 'top-left',
            };
            let text = '';
            if (!args || args.length === 0) {
                await m.reply('Masukkan text untuk brat.\nContoh: !brat text=Halo template=matrix style=mirror mode=animated fontPosition=top-center');
                return;
            }
            // Gabung args jika array
            let argStr = Array.isArray(args) ? args.join(' ') : args;
            // Regex key=value
            let regex = /(\w+)=([#\w\-\%]+)/g;
            let match;
            while ((match = regex.exec(argStr)) !== null) {
                let key = match[1];
                let value = match[2];
                if (key === 'text') text = decodeURIComponent(value);
                else params[key] = decodeURIComponent(value);
            }
            // Jika tidak ada key text, ambil sisa argumen sebagai text
            if (!text) {
                // Ambil argumen tanpa key=val
                let noKey = argStr.replace(regex, '').trim();
                if (noKey) text = noKey;
            }
            if (!text) {
                await m.reply('Masukkan text untuk brat.\nContoh: !brat text=Halo template=matrix style=mirror mode=animated fontPosition=top-center');
                return;
            }
            params.text = text;
            // Kirim reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '🎨', key: m.key }
            });
            // Request ke API brat
            const { data } = await axios.get('https://api.fasturl.link/maker/brat/advanced', {
                params,
                responseType: 'arraybuffer',
                headers: { 'accept': 'image/png' }
            });
            // Buat stiker dari gambar
            const sticker = new Sticker(Buffer.from(data, 'binary'), {
                pack: 'Brat Generator',
                author: 'KanataBot',
                type: StickerTypes.FULL,
                categories: ['✨'],
                id: 'brat',
                quality: 80,
            });
            const stickerBuffer = await sticker.toBuffer();
            // Kirim stiker ke user
            await sock.sendMessage(m.chat, {
                sticker: stickerBuffer
            }, { quoted: m });
            // Kirim reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Error in brat:', error);
            await m.reply('❌ Gagal generate brat. Pastikan parameter benar dan coba lagi.');
        }
    }
}

export default handler; 