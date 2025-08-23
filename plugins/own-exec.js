import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);
const isWindows = platform() === 'win32';

export const handler = {
    command: ['$'],
    help: 'Execute shell commands (Limited)\n\nUsage:\n$ <command>\n\nExamples:\n$ dir\n$ echo Hello\n$ systeminfo',
    tags: ['owner'],
    
    isOwner: true,
    
    async exec({ m, args, sock }) {
        try {
            if (!args) {
                await m.reply('❌ Please enter a command to execute!');
                return;
            }

            const execCommand = args;
            
            // Platform specific allowed commands
            const windowsCommands = [
                /^dir(\s+\/[a-z])*(\s+[\w\\.:]+)?$/i,
                /^echo\s+[\w\s"']+$/i,
                /^type\s+[\w\\.:]+$/i,
                /^systeminfo$/i,
                /^ver$/i,
                /^whoami$/i,
                /^hostname$/i,
                /^time\s*\/t$/i,
                /^date\s*\/t$/i,
                /^tasklist$/i,
                /^vol$/i,
                /^cd$/i,
                /^chdir$/i,
                /^where\s+[\w]+$/i
            ];

            const unixCommands = [
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
                /^which\s+\w+$/
            ];

            // Select commands based on platform
            const allowedCommands = isWindows ? windowsCommands : unixCommands;

            // Check if command is allowed
            const isAllowed = allowedCommands.some(pattern => pattern.test(execCommand));
            
            if (!isAllowed) {
                const allowedList = isWindows ? 
                    '• dir, echo, type, systeminfo\n• ver, whoami, hostname\n• time, date, tasklist\n• vol, cd, where' :
                    '• ls, pwd, whoami, date\n• uptime, df, free, ps\n• uname, cat (system files)\n• echo, which';
                    
                await m.reply(`❌ *COMMAND NOT ALLOWED*\n\nOnly basic system commands are allowed:\n${allowedList}`);
                return;
            }

            // Add reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Execute with limits
            const { stdout, stderr } = await execAsync(execCommand, {
                timeout: 15000, // 15 seconds
                maxBuffer: 1024 * 200, // 200KB
                cwd: isWindows ? 'C:\\Windows\\Temp' : '/tmp'
            });

            let result = '';

            if (stdout) {
                const truncatedStdout = stdout.length > 3000 ? 
                    stdout.substring(0, 3000) + '\n\n[Output truncated...]' : stdout;
                result += `📤 *STDOUT*\n\`\`\`\n${truncatedStdout}\n\`\`\`\n`;
            }
            
            if (stderr) {
                const truncatedStderr = stderr.length > 1000 ? 
                    stderr.substring(0, 1000) + '\n\n[Error truncated...]' : stderr;
                result += `⚠️ *STDERR*\n\`\`\`\n${truncatedStderr}\n\`\`\`\n`;
            }

            if (!result) result = '✅ Command executed successfully (no output)';

            await m.reply(result);
            
            // Success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Exec error:', error);
            
            let errorMessage = '❌ *ERROR*\n\n';
            
            if (error.code === 'ETIMEDOUT') {
                errorMessage += 'Command execution timed out (15s limit)';
            } else if (error.code === 'ENOBUFS') {
                errorMessage += 'Command output too large (200KB limit)';
            } else {
                errorMessage += error.message;
            }

            await m.reply(errorMessage);
            
            // Error reaction
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};