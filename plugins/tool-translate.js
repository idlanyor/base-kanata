import fetch from 'node-fetch';

const ISO_LANGUAGES = {
    'af': 'Afrikaans',
    'sq': 'Albanian',
    'am': 'Amharic',
    'ar': 'Arabic',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bn': 'Bengali',
    'bs': 'Bosnian',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'ceb': 'Cebuano',
    'ny': 'Chichewa',
    'zh': 'Chinese',
    'co': 'Corsican',
    'hr': 'Croatian',
    'cs': 'Czech',
    'da': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'eo': 'Esperanto',
    'et': 'Estonian',
    'tl': 'Filipino',
    'fi': 'Finnish',
    'fr': 'French',
    'fy': 'Frisian',
    'gl': 'Galician',
    'ka': 'Georgian',
    'de': 'German',
    'el': 'Greek',
    'gu': 'Gujarati',
    'ht': 'Haitian Creole',
    'ha': 'Hausa',
    'haw': 'Hawaiian',
    'iw': 'Hebrew',
    'hi': 'Hindi',
    'hmn': 'Hmong',
    'hu': 'Hungarian',
    'is': 'Icelandic',
    'ig': 'Igbo',
    'id': 'Indonesian',
    'ga': 'Irish',
    'it': 'Italian',
    'ja': 'Japanese',
    'jw': 'Javanese',
    'kn': 'Kannada',
    'kk': 'Kazakh',
    'km': 'Khmer',
    'ko': 'Korean',
    'ku': 'Kurdish (Kurmanji)',
    'ky': 'Kyrgyz',
    'lo': 'Lao',
    'la': 'Latin',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'lb': 'Luxembourgish',
    'mk': 'Macedonian',
    'mg': 'Malagasy',
    'ms': 'Malay',
    'ml': 'Malayalam',
    'mt': 'Maltese',
    'mi': 'Maori',
    'mr': 'Marathi',
    'mn': 'Mongolian',
    'my': 'Myanmar (Burmese)',
    'ne': 'Nepali',
    'no': 'Norwegian',
    'ps': 'Pashto',
    'fa': 'Persian',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'pa': 'Punjabi',
    'ro': 'Romanian',
    'ru': 'Russian',
    'sm': 'Samoan',
    'gd': 'Scots Gaelic',
    'sr': 'Serbian',
    'st': 'Sesotho',
    'sn': 'Shona',
    'sd': 'Sindhi',
    'si': 'Sinhala',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'so': 'Somali',
    'es': 'Spanish',
    'su': 'Sundanese',
    'sw': 'Swahili',
    'sv': 'Swedish',
    'tg': 'Tajik',
    'ta': 'Tamil',
    'te': 'Telugu',
    'th': 'Thai',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'ur': 'Urdu',
    'uz': 'Uzbek',
    'vi': 'Vietnamese',
    'cy': 'Welsh',
    'xh': 'Xhosa',
    'yi': 'Yiddish',
    'yo': 'Yoruba',
    'zu': 'Zulu'
};

// Bahasa yang menggunakan aksara non-latin
const NON_LATIN_SCRIPTS = [
    'ar', // Arabic
    'bn', // Bengali  
    'zh', // Chinese
    'gu', // Gujarati
    'iw', // Hebrew
    'hi', // Hindi
    'ja', // Japanese
    'kn', // Kannada
    'km', // Khmer
    'ko', // Korean
    'ml', // Malayalam
    'mr', // Marathi
    'my', // Myanmar
    'ne', // Nepali
    'pa', // Punjabi
    'ru', // Russian
    'sd', // Sindhi
    'si', // Sinhala
    'ta', // Tamil
    'te', // Telugu
    'th', // Thai
    'ur', // Urdu
];

async function detectLanguage(text) {
    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        return data[2] || 'auto';
    } catch (error) {
        console.error('Error detecting language:', error);
        return 'auto';
    }
}

async function translate(text, targetLang = 'id', sourceLang = 'auto') {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        let translatedText = '';
        data[0].forEach(item => {
            if (item[0]) translatedText += item[0];
        });

        // Ambil transliterasi jika bahasa target menggunakan aksara non-latin
        let transliteration = '';
        if (NON_LATIN_SCRIPTS.includes(targetLang)) {
            // Transliterasi ke Latin
            const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${targetLang}&tl=en&dt=t&dt=rm&q=${encodeURIComponent(translatedText)}`;
            const transResponse = await fetch(transUrl);
            const transData = await transResponse.json();

            if (transData[1] && transData[1][0] && transData[1][0][1]) {
                transliteration = transData[1][0][1];
            }
        }

        return {
            text: translatedText,
            transliteration: transliteration,
            from: ISO_LANGUAGES[data[2]] || 'Unknown',
            to: ISO_LANGUAGES[targetLang] || 'Unknown'
        };
    } catch (error) {
        throw new Error(`Translation failed: ${error.message}`);
    }
}

export const handler = {
    command: ['tr', 'tl', 'translate'],
    help: 'Menerjemahkan teks ke berbagai bahasa. Gunakan !tr <kode_bahasa> <teks> atau reply pesan dengan !tr <kode_bahasa>',
    tags: ['tools'],

    async exec({ m, args, sock }) {
        try {
            let text, targetLang = 'id';
            args = args.split(' ');
            // Cek jika ada kode bahasa di args pertama
            if (args[0] && ISO_LANGUAGES[args[0].toLowerCase()]) {
                targetLang = args[0].toLowerCase();
                text = args.slice(1).join(' ');
            } else {
                text = args;
            }

            // Jika tidak ada teks tapi ada reply
            if (!text && m.quoted) {
                text = m.quoted.text || m.quoted.message?.conversation || '';
            }

            // Validasi input
            if (!text) {
                let helpText = `🌐 *TRANSLATOR*\n\n`;
                helpText += `Cara penggunaan:\n`;
                helpText += `1. !tr <kode_bahasa> <teks>\n`;
                helpText += `2. Reply pesan dengan !tr <kode_bahasa>\n\n`;
                helpText += `Contoh:\n`;
                helpText += `- !tr en Selamat pagi\n`;
                helpText += `- !tr ja Good morning\n\n`;
                helpText += `Daftar kode bahasa:\n`;

                Object.entries(ISO_LANGUAGES).forEach(([code, lang]) => {
                    helpText += `${code} = ${lang}\n`;
                });

                await m.reply(helpText);
                return;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Deteksi bahasa sumber
            const sourceLang = await detectLanguage(text);

            // Terjemahkan
            const result = await translate(text, targetLang, sourceLang);

            // Format pesan hasil
            let response = `🌐 *TRANSLATE*\n\n` +
                `*From:* ${result.from}\n` +
                `*To:* ${result.to}\n\n` +
                `*Original:*\n${text}\n\n` +
                `*Translation:*\n${result.text}`;

            // Tambahkan transliterasi jika bahasa target menggunakan aksara non-latin
            if (NON_LATIN_SCRIPTS.includes(targetLang) && result.transliteration) {
                response += `\n\n*Latin:*\n${result.transliteration}`;
            }

            await m.reply(response);

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in translate command:', error);
            await m.reply(`❌ Error: ${error.message}`);

            // Tambahkan reaksi error
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}; 