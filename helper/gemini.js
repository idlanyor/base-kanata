import { GoogleGenerativeAI } from "@google/generative-ai";
import { findJsFiles } from '../main.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(globalThis.apiKey.gemini);

let pluginCache = null;
let lastPluginUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000;   

const commandCache = new Map();
const COMMAND_CACHE_DURATION = 5000;

async function getAllPluginCommands() {
    const now = Date.now();
    if (pluginCache && (now - lastPluginUpdate) < CACHE_DURATION) {
        return pluginCache;
    }

    const pluginsDir = path.join(__dirname, '../plugins');
    const plugins = {};

    try {
        const pluginFiles = findJsFiles(pluginsDir);
        for (const file of pluginFiles) {
            try {
                const plugin = await import(pathToFileURL(file).href);
                if (!plugin.handler) continue;

                const handlers = Array.isArray(plugin.handler.command) ?
                    plugin.handler.command :
                    [plugin.handler.command];

                handlers.forEach(h => {
                    if (typeof h === 'string') {
                        plugins[h.toLowerCase()] = {
                            ...plugin.handler,
                            description: plugin.handler.help || plugin.handler.tags?.join(', ') || 'No description'
                        };
                    }
                });

            } catch (err) {
                logger.error(`Error loading plugin ${file}:`, err);
            }
        }

        pluginCache = plugins;
        lastPluginUpdate = now;

        return plugins;
    } catch (error) {
        logger.error("Error getting plugin commands:", error);
        return pluginCache || {};
    }
}

export { getAllPluginCommands };

const messageHistory = new Map();
const RATE_LIMIT_DURATION = 2000;
const MAX_RETRIES = 2;

export async function analyzeMessage(message, plugins, retryCount = 0) {
    const lastCallTime = messageHistory.get(message);
    const now = Date.now();

    if (lastCallTime && (now - lastCallTime) < RATE_LIMIT_DURATION) {
        return {
            command: "NO_COMMAND",
            args: "",
            confidence: 0,
            reason: "Rate limited"
        };
    }

    messageHistory.set(message, now);

    for (const [key, time] of messageHistory) {
        if (now - time > RATE_LIMIT_DURATION) {
            messageHistory.delete(key);
        }
    }

    try {
        const analyzeModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `Lu adalah Kanata, bot WhatsApp yang pinter banget. Lu punya fitur-fitur keren berikut:

${JSON.stringify(plugins, null, 2)}

Pesan user: "${message}"

Tugas lu:
1. Analisis pesan user dan tentuin:
   - Command apa yang paling cocok buat dijalanin
   - Parameter apa yang dibutuhin
   - Kalo gaada command yang cocok, balikin "NO_COMMAND"

2. Kalo pesan user itu:
   - Pertanyaan/minta info -> "NO_COMMAND"
   - Chat biasa -> "NO_COMMAND"
   - Gaada parameter jelas -> "NO_COMMAND"
   - Command tapi gajelas -> "NO_COMMAND"

3. Kalo pesan user mau jalanin command:
   - Pastiin user beneran mau jalanin command itu
   - Cek parameter udah bener & lengkap
   - Kalo ragu, mending "NO_COMMAND"

4. Perhatiin kata kunci:
   - Command biasanya pake kata: download, play, convert, search, dll
   - Tapi jangan asal trigger command kalo user cuma nanya/ngobrol

Balikin response dalam format JSON (tanpa backtick):
{
  "command": "nama_command",
  "args": "parameter yang dibutuhin",
  "confidence": 0.0-1.0
}

PENTING: Confidence harus tinggi (>0.8) kalo mau jalanin command!`;

        const result = await analyzeModel.generateContent(prompt);
        const responseText = result.response.text().trim();

        try {
            const cleanJson = responseText.replace(/^\`\`\`json\n|\`\`\`$/g, '').trim();
            const response = JSON.parse(cleanJson);

            if (!response.command || typeof response.confidence !== 'number') {
                throw new Error("Invalid response format");
            }

            // Validasi confidence
            if (response.confidence < 0.8) {
                return {
                    command: "NO_COMMAND",
                    args: "",
                    confidence: 0,
                    reason: "Low confidence command"
                };
            }

            return response;
        } catch (parseError) {
            logger.error("Error parsing Gemini response:", parseError);

            if (retryCount < MAX_RETRIES) {
                logger.info(`Retrying analysis (attempt ${retryCount + 1})`);
                return await analyzeMessage(message, plugins, retryCount + 1);
            }

            return {
                command: "NO_COMMAND",
                args: "",
                confidence: 0,
                reason: "Parse error"
            };
        }
    } catch (error) {
        logger.error("Error in Gemini AI analysis:", error);

        if (retryCount < MAX_RETRIES && error.message.includes('network')) {
            logger.info(`Retrying due to network error (attempt ${retryCount + 1})`);
            return await analyzeMessage(message, plugins, retryCount + 1);
        }

        return {
            command: "NO_COMMAND",
            args: "",
            confidence: 0,
            reason: error.message
        };
    }
}

export async function chatWithAI(message, plugins) {
    try {
        const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `Lu adalah Kanata, bot WhatsApp yang asik dan friendly banget. Lu punya fitur-fitur keren berikut:

${JSON.stringify(plugins, null, 2)}

Info tambahan:
- Prefix command pake "!"
- Ada 3 mode: public (semua bisa pake), self-private (cuma private chat & owner di grup), sama self-me (owner doang)
- Lu punya AI buat ngertiin chat user
- Banyak plugin keren buat macem-macem keperluan

Pesan user: "${message}"

Tugas lu:
1. Kalo user nanya soal fitur/command:
   - Jelasin detail tapi santai
   - Kasih contoh yang gampang
   - Sebutin prefix yang bener
   - Jelasin parameter yang dibutuhin

2. Kalo user nanya cara pake bot:
   - Kasih panduan yang simpel
   - Jelasin mode-mode yang ada
   - Kasih contoh command basic

3. Kalo user nanya hal lain:
   - Jawab yang asik & friendly
   - Kasih info yang berguna
   - Kalo bisa bantu pake command, saranin commandnya

4. Kalo ada error/masalah:
   - Jelasin masalahnya apa
   - Kasih solusi yang gampang
   - Saranin alternatif kalo ada

5. Style ngobrol:
   - Pake bahasa gaul yang asik
   - Pake emoji yang cocok
   - Jawab singkat tapi jelas
   - Tetep sopan & helpful

PENTING:
- Selalu sebut diri lu sebagai "gue" atau "gw"
- Panggil user dengan "lu" atau "kamu"
- Pake bahasa gaul tapi tetep sopan
- Jawab to the point, jangan bertele-tele
- Kalo user mau jalanin command, ingetin prefix "!"
- Kalo command butuh parameter, jelasin parameternya`;

        const result = await chatModel.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        logger.error("Error in chatWithAI:", error);
        return "Sori bro, ada error nih. Coba lagi ntar ya!";
    }
}

export async function processMessageWithAI(message, sender) {
    try {
        const plugins = await getAllPluginCommands();
       
        // Skip processing untuk pesan pendek atau dari bot
        if (message.startsWith('!') || 
            message.length < 3 || 
            sender === globalThis.botNumber) {
            return null;
        }

        // Rate limiting
        const now = Date.now();
        const lastProcessed = commandCache.get(message);
        if (lastProcessed && (now - lastProcessed) < COMMAND_CACHE_DURATION) {
            logger.info("Skipping duplicate message processing");
            return null;
        }
        commandCache.set(message, now);

        // Cleanup old cache
        for (const [key, time] of commandCache) {
            if (now - time > COMMAND_CACHE_DURATION) {
                commandCache.delete(key);
            }
        }

        // Analisis pesan
        const analysis = await analyzeMessage(message, plugins);
        
        // Log untuk debugging
        logger.info(`Message analysis:`, {
            message,
            analysis
        });

        // Handle hasil analisis
        if (analysis.command === "NO_COMMAND" || analysis.reason) {
            logger.info(`Using chat AI: ${analysis.reason || 'Not a command'}`);
            const aiResponse = await chatWithAI(message, plugins);
            return {
                command: "chat",
                args: aiResponse
            };
        }

        // Jalankan command jika confidence tinggi
        if (analysis.confidence >= 0.8 && plugins[analysis.command.toLowerCase()]) {
            logger.info(`Executing command: ${analysis.command}`);
            return {
                command: analysis.command,
                args: analysis.args
            };
        }

        // Fallback ke chat AI
        logger.info('Falling back to chat AI');
        const aiResponse = await chatWithAI(message, plugins);
        return {
            command: "chat",
            args: aiResponse
        };
    } catch (error) {
        logger.error("Error in processMessageWithAI:", error);
        return null;
    }
} 