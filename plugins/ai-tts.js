import fs from 'fs';
import path from 'path';
import { Groq } from 'groq-sdk';
import { execSync } from 'child_process';

const groq = new Groq({ apiKey: globalThis.apiKey.groq });

export const handler = {
    command: ['tts', 'text2speech', 'suara'],
    tags: ['ai'],
    help: 'Text-to-speech (Groq PlayAI). Gunakan !tts <teks> atau reply pesan dengan !tts',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ m, args, sock }) => {
        try {
            let text = args;
            if (!text && m.quoted) {
                text = m.quoted.text || m.quoted.message?.conversation || '';
            }
            if (!text) {
                await m.reply(`🔊 *TEXT TO SPEECH (TTS)*\n\nCara penggunaan:\n1. !tts <teks>\n2. Reply pesan dengan !tts\n\nContoh:\n!tts Selamat pagi, ini suara dari AI\n!tts Halo, apa kabar?`);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Generate TTS dengan Groq
            const wav = await groq.audio.speech.create({
                model: 'playai-tts',
                voice: 'Nia-PlayAI',
                response_format: 'wav',
                input: text,
            });

            const buffer = Buffer.from(await wav.arrayBuffer());
            const wavFile = path.join('temp', `tts_${Date.now()}.wav`);
            const mp3File = wavFile.replace('.wav', '.mp3');
            await fs.promises.writeFile(wavFile, buffer);

            // Convert ke mp3 pakai ffmpeg
            execSync(`ffmpeg -y -i "${wavFile}" -codec:a libmp3lame -qscale:a 2 "${mp3File}"`);

            // Kirim file audio mp3 ke chat dengan contextInfo
            await sock.sendMessage(m.chat, {
                audio: fs.readFileSync(mp3File),
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: 'Text to Speech by Groq',
                        body: 'Nia-PlayAI (TTS)',
                        thumbnailUrl: 'https://files.catbox.moe/5lzdmq.png',
                        sourceUrl: 'https://groq.com',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            // Hapus file temp
            fs.unlinkSync(wavFile);
            fs.unlinkSync(mp3File);

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Error in TTS:', error);
            let errorMessage = '❌ Gagal melakukan text-to-speech!';
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
        }
    }
};

export default handler; 