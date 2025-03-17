import util from 'util';

export const handler = {
    command: ['>'],
    help: 'Evaluasi kode JavaScript\n\nCara penggunaan:\n> <kode>\n\nContoh:\n> 1 + 1\n> console.log("Hello")',
    tags: ['owner'],
    
    isOwner: true,
    
    async exec({ m, args, sock }) {
        try {
            if (!args[0]) {
                await m.reply('❌ Masukkan kode yang akan dieval!');
                return;
            }

            const evalCode = args.join(' ');
            
            // Buat context untuk eval
            const context = {
                sock, m, id: m.chat, sender: m.sender, noTel: m.senderNumber,
                console: {
                    ...console,
                    log: (...args) => {
                        sock.sendMessage(m.chat, {
                            text: `📤 *CONSOLE.LOG*\n\n${args.join(' ')}`
                        });
                    }
                }
            };

            // Format kode
            let code = evalCode;
            if (!code.includes('return')) {
                if (!code.includes(';')) code = 'return ' + code;
            }
            code = `(async () => { try { ${code} } catch(e) { return e } })()`;

            // Eval kode
            const result = await eval(code);
            let output = '✅ *RESULT*\n\n';

            if (result?.stack) {
                output = `❌ *ERROR*\n\n${result.stack}`;
            } else if (typeof result === 'string') {
                output += result;
            } else if (typeof result === 'object') {
                output += JSON.stringify(result, null, 2);
            } else {
                output += util.format(result);
            }

            await m.reply(output);

        } catch (error) {
            await m.reply(`❌ *ERROR*\n\n${error.message}`);
        }
    }
}; 