import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const handler = {
    command: ['#'],
    help: 'Eksekusi command shell\n\nCara penggunaan:\n# <command>\n\nContoh:\n# ls\n# dir',
    tags: ['owner'],
    
    isOwner: true,
    
    async exec({ m, args, sock }) {
        try {
            if (!args[0]) {
                await m.reply('❌ Masukkan perintah yang akan dieksekusi!');
                return;
            }

            const execCommand = args;
            const { stdout, stderr } = await execAsync(execCommand);
            let result = '';

            if (stdout) result += `📤 *STDOUT*\n\n${stdout}\n`;
            if (stderr) result += `⚠️ *STDERR*\n\n${stderr}\n`;

            if (!result) result = '✅ Executed with no output';

            await m.reply(result);

        } catch (error) {
            await m.reply(`❌ *ERROR*\n\n${error.message}`);
        }
    }
}; 