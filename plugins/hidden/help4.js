import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from '../../helper/database.js';
import { getMainCases } from '../misc/help.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handler = {
    command: ['help4', 'h4', 'menu4'],
    tags: ['info'],
    help: 'Menampilkan menu bantuan',
    exec: async ({ sock, m, args, noTel, sender }) => {
        try {
            // Load semua plugin commands
            const pluginsDir = path.join(__dirname, '../')
            const categories = {
                'main': [], // Untuk case dari main.js
                ...Object.fromEntries(
                    fs.readdirSync(pluginsDir)
                        .filter(f => fs.statSync(path.join(pluginsDir, f)).isDirectory())
                        .map(dir => [dir, []])
                )
            }

            // Tambahkan case dari main.js
            const mainCases = getMainCases()
            categories['main'] = mainCases.map(c => ({
                commands: [c.command],
                help: c.help,
                tags: ['main']
            }))

            // Load plugin commands
            const pluginFiles = findJsFiles(pluginsDir)
            for (const file of pluginFiles) {
                try {
                    const plugin = await import('file://' + file)
                    if (!plugin.handler) continue

                    const category = path.basename(path.dirname(file))
                    if (!categories[category] || category.toUpperCase() === 'HIDDEN') continue

                    categories[category].push({
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

            menuText = `╭─「 *SONATA BOT* 」
│
│ 👋 Hai @${noTel}!
│ Selamat ${greeting}
│
│ 📱 *INFO BOT*
│ ▸ Mode: ${await Database.getMode()}
│ ▸ Prefix: !
│\n`

            // Menu per kategori
            for (const [category, plugins] of Object.entries(categories)) {
                if (plugins.length === 0 || category.toUpperCase() === 'HIDDEN') continue

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
                        body: 'Sonata Bot',
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