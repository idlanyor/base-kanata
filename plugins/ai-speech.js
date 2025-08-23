import fs from 'fs-extra';
import { Groq } from 'groq-sdk';
import path from 'path';

const tempDir = './temp';
const groq = new Groq({ apiKey: globalThis.apiKey.groq });

export const handler = {
    command: ['stt', 'speech', 'speech2text', 'transkrip'],
    tags: ['ai'],
    help: 'Speech-to-text (Groq Whisper). Gunakan !stt dengan mereply audio/voice note.',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ m, sock }) => {
        let tmpFile;
        try {
            // Cek apakah ada audio yang di-reply (mengikuti pola audio.js)
            if (!m.quoted || !m.quoted.message?.audioMessage) {
                await m.reply('❗ Reply audio/voice note yang ingin ditranskrip dengan !stt');
                return;
            }

            // Pastikan folder temp ada
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Download audio ke file sementara
            const audioBuffer = await m.quoted.download();
            tmpFile = path.join(tempDir, `stt_${m.chat}_${Date.now()}.m4a`);
            await fs.promises.writeFile(tmpFile, audioBuffer);

            // Transkripsi dengan Groq Whisper
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tmpFile),
                model: 'whisper-large-v3-turbo',
                language: 'id',
                response_format: 'verbose_json',
            });

            // Hapus file sementara
            await fs.promises.unlink(tmpFile);

            // Kirim hasil transkripsi
            if (transcription.text) {
                await m.reply(`🗣️ *HASIL TRANSKRIPSI*\n\n${transcription.text.trim()}`);
            } else {
                await m.reply('❌ Gagal transkripsi audio.');
            }

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Error in speech-to-text:', error);
            let errorMessage = '❌ Gagal melakukan speech-to-text!';
            if (error.message?.includes('API key')) {
                errorMessage += '\n\n*Penyebab:* API key Groq tidak valid atau tidak ditemukan.';
            } else if (error.message?.includes('network')) {
                errorMessage += '\n\n*Penyebab:* Masalah koneksi jaringan. Coba lagi nanti.';
            } else if (error.message?.includes('rate limit')) {
                errorMessage += '\n\n*Penyebab:* Terlalu banyak permintaan. Coba lagi dalam beberapa menit.';
            } else {
                errorMessage += `\n\n*Error:* ${error.message}`;
            }
            await m.reply(errorMessage);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
            // Cleanup file jika error
            if (tmpFile && fs.existsSync(tmpFile)) {
                try { await fs.promises.unlink(tmpFile); } catch {}
            }
        }
    }
};

export default handler; 