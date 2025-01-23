import { uploadGambar2 } from "../../lib/uploader.js";

export const description = "📤 *Upload Image* 📤";
export const handler = "upload"
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {

    if (Buffer.isBuffer(attf)) {
        try {
            // Pesan sukses upload gambar
            const linkGambar = await uploadGambar2(attf);
            await sock.sendMessage(id, {
                text: `✅ *Upload Berhasil!* ✅\n\n🖼️ *Link Gambar*: ${linkGambar}\n\nTerima kasih, gambar sudah berhasil diunggah! 🎉`,
            }, { quoted: m });
        } catch (error) {
            // Pesan error
            console.log('❌ Error creating gambar:', error);
            await sock.sendMessage(id, {
                text: `⚠️ *Terjadi Kesalahan saat upload gambar!* ⚠️\n\n🚨 *Alasan*: ${error.message}\nSilakan coba lagi nanti.`,
            });
        }
        return;
    }

    // Cek nek ora nana gambar sing dilampirkan
    if (!m.message?.conversation && !m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
        return;
    }
    await sock.sendMessage(id, {
        text: `⚠️ *Tidak ada gambar yang ditemukan!* ⚠️\n\n📥 *Cara penggunaan*: Kirim atau balas gambar nganggo caption *upload*.`,
    });
};
