import fetch from "node-fetch";

function parseCoordsFromUrl(url) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (!match) return null;
    return { lat: parseFloat(match[1]), long: parseFloat(match[2]) };
}

function parseDMS(decimal) {
    const deg = Math.floor(Math.abs(decimal));
    const minTotal = (Math.abs(decimal) - deg) * 60;
    const min = Math.floor(minTotal);
    const sec = ((minTotal - min) * 60).toFixed(2);
    return { deg, min, sec };
}

export const handler = {
    command: ['koordinat', 'coord', 'cd'],
    help: 'Ambil koordinat dari link Google Maps (short/long). Contoh: !koordinat <link maps>',
    tags: ['tools'],
    async exec({ m, args, sock }) {
        try {
            let url = args;
            // Jika tidak ada argumen, cek reply
            if (!url && m.quoted) {
                url = m.quoted.text || m.quoted.message?.conversation || '';
            }
            if (!url) {
                await m.reply('Masukkan link Google Maps.\nContoh: !koordinat https://maps.app.goo.gl/uEBHVZ91HSZaJHgA6');
                return;
            }

            // Kirim reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '🗺️', key: m.key }
            });

            // 1. Follow redirect short URL
            const res = await fetch(url, { redirect: "follow" });
            const finalUrl = res.url;

            // 2. Parse koordinat dari URL final
            const coords = parseCoordsFromUrl(finalUrl);
            if (!coords) {
                await m.reply('❌ Gagal mengambil koordinat dari URL. Pastikan link Google Maps valid (bukan lokasi area).');
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });
                return;
            }

            const { lat, long } = coords;
            const latD = parseDMS(lat);
            const longD = parseDMS(long);

            const NS = lat >= 0 ? "LU" : "LS";
            const WE = long >= 0 ? "BT" : "BB";

            let message = `📍 *HASIL KONVERSI KOORDINAT*\n\n`;
            message += `*Garis Lintang*\n${NS} : ${latD.deg}° ${latD.min}′ ${latD.sec}″\n`;
            message += `*Garis Bujur*\n${WE} : ${longD.deg}° ${longD.min}′ ${longD.sec}″\n\n`;
            message += `*Decimal:*\nLatitude: ${lat}\nLongitude: ${long}\n`;
            message += `\n*Link Maps:*\n${finalUrl}`;

            await m.reply(message);

            // Kirim reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (err) {
            console.error("Error in koordinat plugin:", err.message);
            await m.reply('❌ Terjadi error saat mengambil koordinat. Pastikan link valid.');
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};

export default handler;
