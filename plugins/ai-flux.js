import axios from 'axios';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = {
    command: ['flux'],
    tags: ['ai'],
    help: 'Generate gambar menggunakan Flux AI. Gunakan !flux <prompt> atau reply pesan dengan !flux',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ m, args, sock }) => {
        try {
            let prompt = args;

            // Jika tidak ada prompt tapi ada reply
            if (!prompt && m.quoted) {
                prompt = m.quoted.text || m.quoted.message?.conversation || '';
            }

            // Validasi input
            if (!prompt) {
                await m.reply(`🎨 *FLUX AI IMAGE GENERATOR*\n\nCara penggunaan:\n1. !flux <deskripsi gambar>\n2. Reply pesan dengan !flux\n\nContoh:\n!flux A majestic lion with golden mane in sunset\n!flux Cyberpunk city at night with neon lights\n!flux Beautiful landscape with mountains and lake\n\n💡 Tips:\n• Berikan deskripsi yang detail\n• Sebutkan style yang diinginkan\n• Jelaskan warna dan suasana\n• Semakin detail prompt, semakin bagus hasil`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Kirim pesan proses
            await m.reply('🎨 Sedang membuat gambar... Mohon tunggu sebentar');

            // Proses generate gambar menggunakan API
            const apiUrl = `https://api.fasturl.link/aiimage/flux/diffusion?prompt=${encodeURIComponent(prompt)}`;
            const response = await axios.get(apiUrl, {
                headers: {
                    'accept': 'image/jpeg',
                    'x-api-key': globalThis.apiKey.fasturl
                },
                responseType: 'arraybuffer'
            });

            // Simpan gambar ke file temporary
            const tempDir = join(__dirname, '../../temp');
            const tempFile = join(tempDir, `flux_${Date.now()}.jpg`);
            await writeFile(tempFile, response.data);

            // Kirim gambar dengan caption
            await sock.sendMessage(m.chat, {
                image: { url: tempFile },
                caption: `🎨 *FLUX AI GENERATED IMAGE*\n\n` +
                        `📝 *Prompt:* ${prompt}\n\n` +
                        `⏰ *Generated at:* ${new Date().toLocaleString('id-ID')}`,
                contextInfo: {
                    externalAdReply: {
                        title: '🎨 Flux AI Image Generator',
                        body: 'Generated using Flux AI',
                        thumbnailUrl: tempFile,
                        sourceUrl: 'https://api.fasturl.link',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

            // Hapus file temporary setelah 1 menit
            setTimeout(() => {
                try {
                    fs.unlinkSync(tempFile);
                } catch (err) {
                    console.error('Error deleting temp file:', err);
                }
            }, 60000);

        } catch (error) {
            console.error('Error in flux command:', error);
            
            let errorMessage = '❌ Gagal membuat gambar!';
            
            if (error.response?.status === 400) {
                errorMessage += '\n\n*Penyebab:* Prompt tidak valid atau terlalu pendek.';
            } else if (error.response?.status === 401) {
                errorMessage += '\n\n*Penyebab:* API key tidak valid.';
            } else if (error.response?.status === 429) {
                errorMessage += '\n\n*Penyebab:* Terlalu banyak permintaan. Coba lagi nanti.';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage += '\n\n*Penyebab:* Tidak dapat terhubung ke server API.';
            } else {
                errorMessage += `\n\n*Error:* ${error.message}`;
            }

            await m.reply(errorMessage);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};

export default handler; 