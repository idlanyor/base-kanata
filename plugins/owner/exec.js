import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const handler = {
    command: ['#'],
    help: 'Eksekusi command shell (Terbatas)\n\nCara penggunaan:\n# <command>\n\nContoh:\n# ls\n# pwd\n# date',
    tags: ['owner'],
    
    isOwner: true,
    
    async exec({ m, args, sock }) {
        try {
            if (!args[0]) {
                await m.reply('❌ Masukkan perintah yang akan dieksekusi!');
                return;
            }

            const execCommand = args.join(' ');
            
            // Security validation: Block dangerous commands
            const dangerousCommands = [
                /rm\s+(-rf\s+)?[\/~]/i,  // rm with root or home paths
                /sudo/i,
                /su\s/i,
                /passwd/i,
                /chmod\s+777/i,
                /chown/i,
                /dd\s+if=/i,
                /mkfs/i,
                /fdisk/i,
                /mount/i,
                /umount/i,
                /kill\s+-9/i,
                /pkill/i,
                /killall/i,
                /reboot/i,
                /shutdown/i,
                /halt/i,
                /init\s+0/i,
                /crontab/i,
                /systemctl/i,
                /service/i,
                /iptables/i,
                /firewall/i,
                /wget.*\|.*sh/i,
                /curl.*\|.*sh/i,
                /nc\s+-l/i,  // netcat listener
                /ncat\s+-l/i,
                /telnet/i,
                /ssh/i,
                /scp/i,
                /rsync/i,
                /tar.*--to-command/i,
                /find.*-exec/i,
                /xargs/i,
                /eval/i,
                /exec/i,
                /system/i,
                /\|\s*sh/i,
                /\|\s*bash/i,
                /&&/i,
                /\|\|/i,
                /;/i,
                /`/i,  // backticks
                /\$\(/i,  // command substitution
            ];

            // Check for dangerous patterns
            for (const pattern of dangerousCommands) {
                if (pattern.test(execCommand)) {
                    await m.reply('❌ *SECURITY ERROR*\n\nCommand yang Anda masukkan tidak diizinkan karena alasan keamanan.');
                    return;
                }
            }

            // Whitelist of allowed commands (basic system info only)
            const allowedCommands = [
                /^ls(\s+-[alht]+)?(\s+[\w\/.]+)?$/,
                /^pwd$/,
                /^whoami$/,
                /^date$/,
                /^uptime$/,
                /^df(\s+-h)?$/,
                /^free(\s+-h)?$/,
                /^ps(\s+aux)?$/,
                /^uname(\s+-a)?$/,
                /^cat\s+\/proc\/(version|cpuinfo|meminfo)$/,
                /^echo\s+[\w\s"']+$/,
                /^which\s+\w+$/,
                /^head(\s+-n\s+\d+)?\s+[\w\/\.]+$/,
                /^tail(\s+-n\s+\d+)?\s+[\w\/\.]+$/,
                /^wc(\s+-[lwc]+)?\s+[\w\/\.]+$/,
                /^grep(\s+-[inr]+)?\s+"?[\w\s]+"?\s+[\w\/\.]+$/
            ];

            // Check if command is in whitelist
            const isAllowed = allowedCommands.some(pattern => pattern.test(execCommand));
            
            if (!isAllowed) {
                await m.reply('❌ *COMMAND NOT ALLOWED*\n\nHanya command dasar sistem yang diizinkan:\n• ls, pwd, whoami, date\n• uptime, df, free, ps\n• uname, cat (file sistem)\n• echo, which, head, tail, wc, grep');
                return;
            }

            // Execute with timeout and size limits
            const timeout = 10000; // 10 seconds max
            const maxBuffer = 1024 * 100; // 100KB max output

            const { stdout, stderr } = await execAsync(execCommand, {
                timeout: timeout,
                maxBuffer: maxBuffer,
                cwd: '/tmp' // Restrict to safe directory
            });

            let result = '';

            if (stdout) {
                // Limit output size
                const truncatedStdout = stdout.length > 2000 ? 
                    stdout.substring(0, 2000) + '\n\n[Output truncated...]' : stdout;
                result += `📤 *STDOUT*\n\n${truncatedStdout}\n`;
            }
            
            if (stderr) {
                const truncatedStderr = stderr.length > 1000 ? 
                    stderr.substring(0, 1000) + '\n\n[Error truncated...]' : stderr;
                result += `⚠️ *STDERR*\n\n${truncatedStderr}\n`;
            }

            if (!result) result = '✅ Executed with no output';

            await m.reply(result);

        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                await m.reply('❌ *TIMEOUT ERROR*\n\nCommand execution timed out (10s limit)');
            } else if (error.code === 'ENOBUFS') {
                await m.reply('❌ *OUTPUT ERROR*\n\nCommand output too large (100KB limit)');
            } else {
                await m.reply(`❌ *ERROR*\n\n${error.message}`);
            }
        }
    }
}; 