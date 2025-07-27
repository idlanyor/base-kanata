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
                /this\s*\./i
            ];

            // Check for dangerous patterns
            for (const pattern of dangerousPatterns) {
                if (pattern.test(evalCode)) {
                    await m.reply('❌ *SECURITY ERROR*\n\nKode yang Anda masukkan mengandung operasi yang tidak diizinkan untuk keamanan sistem.');
                    return;
                }
            }

            // Whitelist of allowed operations
            const allowedGlobals = {
                Math,
                Date,
                JSON,
                Array,
                Object,
                String,
                Number,
                Boolean,
                parseInt,
                parseFloat,
                isNaN,
                isFinite
            };

            // Create safe evaluation function
            const safeEval = (code) => {
                try {
                    // Simple arithmetic and basic operations only
                    if (/^[\d\s+\-*/().]+$/.test(code)) {
                        return Function('"use strict"; return (' + code + ')')();
                    }
                    
                    // For more complex but safe operations
                    const func = new Function('globals', `
                        "use strict";
                        const {${Object.keys(allowedGlobals).join(',')}} = globals;
                        return (${code});
                    `);
                    
                    return func(allowedGlobals);
                } catch (error) {
                    throw error;
                }
            };

            // Execute safe evaluation
            const result = safeEval(evalCode);
            let output = '✅ *RESULT*\n\n';

            if (typeof result === 'string') {
                output += result;
            } else if (typeof result === 'object' && result !== null) {
                output += JSON.stringify(result, null, 2);
            } else {
                output += String(result);
            }

            await m.reply(output);

        } catch (error) {
            await m.reply(`❌ *ERROR*\n\n${error.message}`);
        }
    }
}; 