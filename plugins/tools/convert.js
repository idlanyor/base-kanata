import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';

const execAsync = promisify(exec);

export const handler = {
    command: ['tovn', 'tomp3'],
    help: 'Konversi format audio\n\nPerintah:\n!tovn - Konversi audio ke voice note\n!tomp3 - Konversi voice note ke MP3',
    tags: ['tools'],
    
    async exec({ m, sock }) {
        try {
            const cmd = m.command;
            
            // Cek apakah ada audio yang di-reply
            if (!m.quoted || !m.quoted.message?.audioMessage) {
                await m.reply('❌ Reply audio yang ingin dikonversi!');
                return;
            }

            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            const audio = await m.quoted.download();
            const inputPath = `./temp/${m.chat}_input.${cmd === 'tovn' ? 'mp3' : 'opus'}`;
            const outputPath = `./temp/${m.chat}_output.${cmd === 'tovn' ? 'opus' : 'mp3'}`;

            await fs.promises.writeFile(inputPath, audio);

            // Proses konversi sesuai command
            if (cmd === 'tovn') {
                // Konversi ke format opus dengan bitrate yang sesuai untuk VN
                await execAsync(`ffmpeg -i ${inputPath} -af "silenceremove=1:0:-50dB" -c:a libopus -b:a 128k ${outputPath}`);
                
                await sock.sendMessage(m.chat, {
                    audio: { url: outputPath },
                    mimetype: 'audio/mp4',
                    ptt: true // Set true untuk mengirim sebagai voice note
                }, { quoted: m });
            } else {
                // Konversi ke format MP3 dengan kualitas yang lebih baik
                await execAsync(`ffmpeg -i ${inputPath} -acodec libmp3lame -ab 320k ${outputPath}`);
                
                await sock.sendMessage(m.chat, {
                    audio: { url: outputPath },
                    mimetype: 'audio/mp4',
                    ptt: false // Set false untuk mengirim sebagai MP3
                }, { quoted: m });
            }

            // Hapus file temporary
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error(`Error in ${m.command}:`, error);
            await m.reply(`❌ Error: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}; 