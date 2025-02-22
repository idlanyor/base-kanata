import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import pkg from '@seaavey/baileys'
const { proto, generateWAMessageFromContent } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Fungsi untuk mencari file JS
function findJsFiles(dir) {
    let results = []
    const list = fs.readdirSync(dir)
    list.forEach(file => {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat && stat.isDirectory()) {
            results = results.concat(findJsFiles(filePath))
        }
        else if (file.endsWith('.js')) {
            results.push(filePath)
        }
    })
    return results
}

// Ambil case dari main.js
function getMainCases() {
    try {
        const mainPath = path.join(__dirname, '../../main.js')
        const mainContent = fs.readFileSync(mainPath, 'utf8')
        
        // Cari case dalam switch statement
        const switchMatch = mainContent.match(/switch\s*\([^)]+\)\s*{([^}]+)}/s)
        if (!switchMatch) return []
        
        const caseMatches = switchMatch[1].match(/case\s+['"]([^'"]+)['"]/g)
        if (!caseMatches) return []

        return caseMatches.map(caseStr => {
            const cmd = caseStr.match(/case\s+['"]([^'"]+)['"]/)[1]
            // Cari deskripsi dalam komentar di atas case (jika ada)
            const caseIndex = mainContent.indexOf(caseStr)
            const beforeCase = mainContent.substring(0, caseIndex)
            const commentMatch = beforeCase.match(/\/\/\s*([^\n]+)\s*\n\s*$/);
            const description = commentMatch ? commentMatch[1] : 'Tidak ada deskripsi'
            
            return {
                command: cmd,
                help: description
            }
        })
    } catch (error) {
        console.error('Error reading main.js:', error)
        return []
    }
}

export const handler = {
    command: ['help', 'h', 'menu'],
    tags: ['info'],
    help: 'Menampilkan menu bantuan',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args, noTel, sender }) => {
        try {
            const pluginsDir = path.join(__dirname, '../')
            const categories = {
                'main': [], // Kategori untuk case dari main.js
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
                tags: ['main'],
                isAdmin: false,
                isBotAdmin: false,
                isOwner: false,
                isGroup: false
            }))

            // Load plugin commands
            const pluginFiles = findJsFiles(pluginsDir)
            for (const file of pluginFiles) {
                try {
                    const plugin = await import('file://' + file)
                    if (!plugin.handler) continue

                    const category = path.basename(path.dirname(file))
                    if (!categories[category]) continue

                    const commands = Array.isArray(plugin.handler.command) ? 
                        plugin.handler.command : 
                        [plugin.handler.command]

                    categories[category].push({
                        commands: commands.map(cmd => typeof cmd === 'string' ? cmd : cmd.source),
                        help: plugin.handler.help || 'Tidak ada deskripsi',
                        tags: plugin.handler.tags || [],
                        isAdmin: plugin.handler.isAdmin,
                        isBotAdmin: plugin.handler.isBotAdmin,
                        isOwner: plugin.handler.isOwner,
                        isGroup: plugin.handler.isGroup
                    })
                } catch (err) {
                    console.error(`Error loading plugin ${file}:`, err)
                }
            }

            // Jika ada args (dari klik list), tampilkan detail command
            if (args) {
                const searchCmd = args.toLowerCase()
                let found = false

                for (const [category, plugins] of Object.entries(categories)) {
                    for (const plugin of plugins) {
                        const cmdList = Array.isArray(plugin.commands) ? 
                            plugin.commands : [plugin.commands]
                            
                        if (cmdList.includes(searchCmd)) {
                            let detailMenu = `📚 *Command Detail*\n\n`
                            detailMenu += `Command: ${cmdList.join(', ')}\n`
                            detailMenu += `Description: ${plugin.help}\n`
                            detailMenu += `Category: ${category}\n`
                            detailMenu += `Tags: ${plugin.tags?.join(', ') || '-'}\n\n`
                            detailMenu += `Requirements:\n`
                            detailMenu += `${plugin.isAdmin ? '✓' : '×'} Admin Group\n`
                            detailMenu += `${plugin.isBotAdmin ? '✓' : '×'} Bot Admin\n`
                            detailMenu += `${plugin.isOwner ? '✓' : '×'} Owner Bot\n`
                            detailMenu += `${plugin.isGroup ? '✓' : '×'} In Group`

                            await m.reply(detailMenu)
                            found = true
                            break
                        }
                    }
                    if (found) break
                }

                if (!found) {
                    await m.reply(`❌ Command "${args}" not found`)
                }
                return
            }

            let menuText = ''

            // Iterasi setiap kategori dan plugin
            for (const [category, plugins] of Object.entries(categories)) {
                if (plugins.length === 0 || category.toUpperCase() === 'HIDDEN') continue

                menuText += `\n┌─「 ${category.toUpperCase()} 」\n`
                
                // Tambahkan setiap command
                for (const plugin of plugins) {
                    const cmdList = Array.isArray(plugin.commands) ? plugin.commands : [plugin.commands]
                    
                    for (const cmd of cmdList) {
                        menuText += `├ !${cmd}\n`
                        menuText += `│ ${plugin.help || 'Tidak ada deskripsi'}\n`
                    }
                }
                
                menuText += '└──────────────\n'
            }

            const time = new Date()
            const hours = time.getHours()
            let greeting = ''
            if (hours >= 4 && hours < 11) greeting = 'Pagi'
            else if (hours >= 11 && hours < 15) greeting = 'Siang'
            else if (hours >= 15 && hours < 18) greeting = 'Sore'
            else greeting = 'Malam'

            await sock.sendMessage(m.chat, {
                video: await fetch('https://fastrestapis.fasturl.cloud/file/v1/ZuI20w4'),
                gifPlayback: true,
                gifAttribution: 'SONATA.BOT',
                caption: `╭─「 KANATA BOT 」
├ Selamat ${greeting} 👋
├ @${noTel}
│
├ Berikut adalah daftar menu
├ yang tersedia:
${menuText}
╰──────────────────`,
                contextInfo: {
                    mentionedJid: [sender],
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363305152329358@newsletter',
                        newsletterName: 'Kanata Bot',
                        serverMessageId: -1
                    },
                    externalAdReply: {
                        title: '乂 Kanata Bot Menu 乂',
                        body: 'Click here to join our channel!',
                        thumbnailUrl: 'https://s6.imgcdn.dev/YYoFZh.jpg',
                        sourceUrl: 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

        } catch (error) {
            console.error('Error in help:', error)
            await m.reply('❌ Terjadi kesalahan saat memuat menu')
        }
    }
}

export default handler