import axios from "axios";
import { Sticker, StickerTypes } from "wa-sticker-formatter";

export const handler = {
    command: ["qc", "quotly", "quote"],
    help: "Membuat stiker quote dari teks. Gunakan !qc <teks> atau reply pesan dengan !qc",
    tags: ["sticker"],

    async exec({ m, args, sock }) {
        try {
            let text = args;
            let name = "User";
            let avatar = "https://i.ibb.co/3Fh9V6p/avatar-default.png"; // default avatar

            // 🔹 Kalau gak ada teks tapi ada reply
            if (!text && m.quoted) {
                text =
                    m.quoted.text || m.quoted.message?.conversation || "";

                // Ambil nama
                if (m.quoted.participant) {
                    const contact = await sock.onWhatsApp(m.quoted.participant);
                    name = contact[0]?.notify || m.quoted.pushName || "User";
                } else {
                    name = m.quoted?.pushName || "User";
                }

                // Ambil avatar
                try {
                    const ppUrl = await sock.profilePictureUrl(
                        m.quoted.participant || m.quoted.key.remoteJid,
                        "image"
                    );
                    if (ppUrl) avatar = ppUrl;
                } catch { }
            }
            // 🔹 Kalau gak ada teks dan gak reply, ambil dari pesan sekarang
            else if (text) {
                if (m.message) {
                    const messageType = Object.keys(m.message)[0];
                    if (messageType === "conversation") {
                        text = args
                    } else if (messageType === "extendedTextMessage") {
                        text = m.message.extendedTextMessage.text.replace(/^!qc\s*/, "");
                    }
                }

                name = m.pushName || "User";
                try {
                    const ppUrl = await sock.profilePictureUrl(
                        m.sender,
                        "image"
                    );
                    if (ppUrl) avatar = ppUrl;
                } catch { }
            }

            // 🔹 Validasi input
            if (!text || text.trim() === "") {
                await m.reply(
                    `💬 *QUOTLY STICKER MAKER*\n\nCara pakai:\n1. !qc <teks>\n2. Reply pesan dengan !qc\n\nContoh:\n!qc Hello World!\n!qc Selamat pagi semua\n\n📌 Avatar otomatis dari foto profil.`
                );
                return;
            }

            text = text.trim();

            // ⏳ Kasih reaksi loading
            await sock.sendMessage(m.chat, {
                react: { text: "⏳", key: m.key },
            });
            console.log(text, name, avatar)
            // 🔹 Call API
            const apiUrl = "https://api.ryzumi.vip/api/image/quotly";
            const response = await axios.get(apiUrl, {
                params: { text, name, avatar },
                responseType: "arraybuffer",
                headers: { accept: "image/png" },
                timeout: 30000,
            });

            if (!response.data) throw new Error("Gagal membuat quote sticker");

            // 🔹 Bikin stiker
            const sticker = new Sticker(Buffer.from(response.data), {
                pack: "Quotly Sticker",
                author: "Kanata Bot",
                type: StickerTypes.FULL,
                categories: ["💬"],
                id: `qc-${Date.now()}`,
                quality: 50,
            });

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });

            // ✅ Reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key },
            });
        } catch (error) {
            console.error("Error di qc command:", error);

            let msg = "❌ Gagal membuat quote sticker!";
            if (error.code === "ENOTFOUND") msg += "\n\n*Penyebab:* Server API gak ketemu.";
            else if (error.code === "ECONNABORTED") msg += "\n\n*Penyebab:* Timeout, coba lagi.";
            else if (error.response?.status === 400) msg += "\n\n*Penyebab:* Parameter salah.";
            else if (error.response?.status === 429) msg += "\n\n*Penyebab:* Kebanyakan request, sabar napa.";
            else msg += `\n\n*Error:* ${error.message}`;

            await m.reply(msg);
            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key },
            });
        }
    },
};

export default handler;
