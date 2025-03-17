import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';

const execAsync = promisify(exec);

export const handler = {
    command: ['bass', 'nightcore', 'slow', 'robot', 'reverse'],
    help: 'Efek audio untuk pesan suara\n\nPerintah:\n!bass - Efek bass boost\n!nightcore - Efek nightcore (pitch up + tempo up)\n!slow - Efek slow motion\n!robot - Efek suara robot\n!reverse - Membalik audio',
    tags: ['tools'],
    
    async exec({ m, sock }) {
        try {
            const cmd = m.command;
            
            // Cek apakah ada audio yang di-reply
            if (!m.quoted || !m.quoted.message?.audioMessage) {
                await m.reply('❌ Reply audio yang ingin diberi efek!');
                return;
            }

            await m.reply('⏳ Sedang memproses audio...');
            const audio = await m.quoted.download();
            const inputPath = `./temp/${m.chat}_input.mp3`;
            const outputPath = `./temp/${m.chat}_${cmd}.mp3`;

            await fs.promises.writeFile(inputPath, audio);

            // Proses efek sesuai command
            switch(cmd) {
                case 'bass':
                    await execAsync(`ffmpeg -i ${inputPath} -af "bass=g=15:f=110:w=0.6" ${outputPath}`);
                    break;
                case 'nightcore':
                    await execAsync(`ffmpeg -i ${inputPath} -af "asetrate=44100*1.25,aresample=44100,atempo=1.05" ${outputPath}`);
                    break;
                case 'slow':
                    await execAsync(`ffmpeg -i ${inputPath} -af "atempo=0.8" ${outputPath}`);
                    break;
                case 'robot':
                    await execAsync(`ffmpeg -i ${inputPath} -af "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75" ${outputPath}`);
                    break;
                case 'reverse':
                    await execAsync(`ffmpeg -i ${inputPath} -af "areverse" ${outputPath}`);
                    break;
            }

            await sock.sendMessage(m.chat, {
                audio: { url: outputPath },
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: m });

            // Hapus file temporary
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

        } catch (error) {
            console.error(`Error in ${m.command}:`, error);
            await m.reply(`❌ Error: ${error.message}`);
        }
    }
}; 