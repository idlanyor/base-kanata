import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from '../helper/database.js';
import { getMainCases } from './tool-help.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fungsi findJsFiles yang hanya membaca file langsung dari direktori
function findJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Hanya ambil file .js dari direktori utama, tidak rekursif ke subfolder
        if (stat && stat.isFile() && file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

const handler = {
    command: ['help4', 'h4', 'menu4'],
    tags: ['info'],
    help: 'Menampilkan menu bantuan',
    exec: async ({ sock, m, args, noTel, sender }) => {
        try {
            // Load semua plugin commands
            const pluginsDir = path.join(__dirname, '../')
            const categories = {
                'main': [], // Untuk case dari main.js dan plugin langsung
            }

            // Tambahkan case dari main.js
            const mainCases = getMainCases()
            categories['main'] = mainCases.map(c => ({
                commands: [c.command],
                help: c.help,
                tags: ['main']
            }))

            // Load plugin commands langsung dari folder plugins
            const pluginFiles = findJsFiles(pluginsDir)
            for (const file of pluginFiles) {
                try {
                    const plugin = await import('file://' + file)
                    if (!plugin.handler) continue

                    categories['main'].push({
                        commands: Array.isArray(plugin.handler.command) ? 
                            plugin.handler.command : 
                            [plugin.handler.command],
                        help: plugin.handler.help || 'Tidak ada deskripsi',
                        tags: plugin.handler.tags || []
                    })
                } catch (err) {
                    console.error(`Error loading plugin ${file}:`, err)
                }
            }

            // Buat menu text
            let menuText = ''
            
            // Header
            const time = new Date()
            const hours = time.getHours()
            let greeting = hours >= 4 && hours < 11 ? 'Pagi' :
                          hours >= 11 && hours < 15 ? 'Siang' :
                          hours >= 15 && hours < 18 ? 'Sore' : 'Malam'

            menuText = `╭─「 *KANATA BOT* 」
│
│ 👋 Hai @${noTel}!
│ Selamat ${greeting}
│
│ 📱 *INFO BOT*
│ ▸ Mode: ${await Database.getBotMode()}
│ ▸ Prefix: !
│\n`

            // Menu per kategori
            for (const [category, plugins] of Object.entries(categories)) {
                if (plugins.length === 0) continue

                menuText += `│ *${category.toUpperCase()}*\n`
                for (const plugin of plugins) {
                    const cmdList = plugin.commands.map(cmd => `!${cmd}`).join(', ')
                    menuText += `│ ▸ ${cmdList}\n`
                }
                menuText += '│\n'
            }

            menuText += `╰────────────⭐\n\n` +
                       `*Note:*\n` +
                       `• Ketik !help <command> untuk info detail\n` +
                       `• Gunakan bot dengan bijak!`

            // Kirim menu
            await sock.sendMessage(m.chat, {
                text: menuText,
                mentions: [sender],
                contextInfo: {
                    externalAdReply: {
                        title: '乂 Menu List 乂',
                        body: 'Kanata Bot',
                        thumbnailUrl: `${globalThis.ppUrl}`,
                        sourceUrl: `${globalThis.newsletterUrl}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })

        } catch (error) {
            console.error('Error in help:', error)
            await m.reply('❌ Terjadi kesalahan saat memuat menu')
        }
    }
}

export default handler;