import util from 'util';

export const handler = {
    command: ['>'],
    help: 'Evaluasi kode JavaScript (Aman)\n\nCara penggunaan:\n> <kode>\n\nContoh:\n> 1 + 1\n> Math.max(1, 2, 3)',
    tags: ['owner'],
    
    isOwner: true,
    
    async exec({ m, args, sock }) {
        try {
            if (!args) {
                await m.reply('❌ Masukkan kode yang akan dieval!');
                return;
            }

            const evalCode = args;
            
            // Security check: Block dangerous functions and keywords
            const dangerousPatterns = [
                /require\s*\(/i,
                /import\s*\(/i,
                /process\s*\./i,
                /global\s*\./i,
                /fs\s*\./i,
                /child_process/i,
                /exec\s*\(/i,
                /spawn\s*\(/i,
                /eval\s*\(/i,
                /Function\s*\(/i,
                /constructor/i,
                /prototype/i,
                /__proto__/i,
                /this\s*\./i,
                /\[.*\]\..*\(/i, // Prevent array method calls
                /\{.*\}\..*\(/i, // Prevent object method calls
                /setTimeout|setInterval/i,
                /Promise|async|await/i,
                /\bvm\b|virtualMachine/i
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(evalCode)) {
                    await m.reply('❌ *SECURITY ERROR*\n\nKode yang Anda masukkan mengandung operasi yang tidak diizinkan untuk keamanan sistem.');
                    return;
                }
            }

            // Enhanced whitelist of allowed operations
            const allowedGlobals = {
                Math: {
                    abs: Math.abs,
                    ceil: Math.ceil,
                    floor: Math.floor,
                    max: Math.max,
                    min: Math.min,
                    pow: Math.pow,
                    random: Math.random,
                    round: Math.round,
                    sqrt: Math.sqrt
                },
                Date: {
                    now: Date.now,
                    parse: Date.parse
                },
                JSON: {
                    parse: JSON.parse,
                    stringify: JSON.stringify
                },
                Number: {
                    isInteger: Number.isInteger,
                    parseFloat: Number.parseFloat,
                    parseInt: Number.parseInt
                },
                String: {
                    fromCharCode: String.fromCharCode
                },
                parseInt,
                parseFloat,
                isNaN,
                isFinite
            };

            // Create sandbox environment
            const sandbox = {
                ...allowedGlobals,
                console: {
                    log: (...args) => args.join(' ')
                }
            };

            // Enhanced safe evaluation function
            const safeEval = (code) => {
                try {
                    // For simple arithmetic
                    if (/^[\d\s+\-*/().]+$/.test(code)) {
                        return new Function('"use strict"; return (' + code + ')')();
                    }
                    
                    // For more complex operations
                    const wrappedCode = `
                        "use strict";
                        with (sandbox) {
                            return (${code});
                        }
                    `;
                    
                    const secureFunction = new Function('sandbox', wrappedCode);
                    return secureFunction(sandbox);
                } catch (error) {
                    throw new Error(`Evaluation Error: ${error.message}`);
                }
            };

            const result = safeEval(evalCode);
            let output = '✅ *RESULT*\n\n';

            if (result === undefined) {
                output += 'undefined';
            } else if (result === null) {
                output += 'null';
            } else if (typeof result === 'string') {
                output += result;
            } else if (typeof result === 'object') {
                output += util.inspect(result, { depth: 2, colors: false });
            } else {
                output += String(result);
            }

            await m.reply(output);

        } catch (error) {
            await m.reply(`❌ *ERROR*\n\n${error.message}`);
        }
    }
};
