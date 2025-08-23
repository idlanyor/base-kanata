import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import pkg from 'baileys'
const { proto, generateWAMessageFromContent } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Fungsi untuk mencari file JS - hanya dari direktori utama
function findJsFiles(dir) {
    let results = []
    const list = fs.readdirSync(dir)
    list.forEach(file => {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        // Hanya ambil file .js dari direktori utama, tidak rekursif ke subfolder
        if (stat && stat.isFile() && file.endsWith('.js')) {
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
                'main': [], // Kategori untuk case dari main.js dan plugin langsung
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

            // Load plugin commands langsung dari folder plugins
            const pluginFiles = findJsFiles(pluginsDir)
            for (const file of pluginFiles) {
                try {
                    const plugin = await import('file://' + file)
                    if (!plugin.handler) continue

                    categories['main'].push({
                        commands: Array.isArray(plugin.handler.command) ?
                            [plugin.handler.command[0]] : // Ambil command pertama saja jika array
                            [plugin.handler.command],
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
                            [plugin.commands[0]] : // Ambil command pertama saja jika array
                            [plugin.commands]

                        if (cmdList.includes(searchCmd)) {
                            const icon = categoryIcons[category] || '📁'
                            let detailMenu = `╭─「 📚 COMMAND DETAIL 」\n` +
                                `├ Command: !${cmdList[0]}\n` +
                                `├ Description: ${plugin.help}\n` +
                                `├ Category: ${icon} ${category.toUpperCase()}\n` +
                                `├ Tags: ${plugin.tags?.join(', ') || '-'}\n` +
                                `│\n` +
                                `├ 📋 *REQUIREMENTS:*\n` +
                                `├ ${plugin.isAdmin ? '✅' : '❌'} Admin Group\n` +
                                `├ ${plugin.isBotAdmin ? '✅' : '❌'} Bot Admin\n` +
                                `├ ${plugin.isOwner ? '✅' : '❌'} Owner Bot\n` +
                                `├ ${plugin.isGroup ? '✅' : '❌'} In Group\n` +
                                `│\n` +
                                `├ 💡 *USAGE:*\n` +
                                `├ !${cmdList[0]} <parameter>\n` +
                                `├ Reply: !${cmdList[0]}\n` +
                                `╰──────────────────`

                            await m.reply(detailMenu)
                            found = true
                            break
                        }
                    }
                    if (found) break
                }

                // if (!found) {
                //     await m.reply(`❌ Command "${args}" not found`)
                // }
                // return
            }

            // Kategorisasi yang lebih baik
            const categoryIcons = {
                'main': '⚡',
                'ai': '🤖',
                'converter': '🔄',
                'downloader': '📥',
                'group': '👥',
                'hidden': '🔒',
                'misc': '🛠️',
                'moderation': '🛡️',
                'owner': '👑',
                'search': '🔍',
                'sticker': '🎯',
                'tools': '⚙️'
            }

            // Urutan kategori yang diinginkan
            const categoryOrder = [
                'main', 'ai', 'downloader', 'search', 'converter',
                'sticker', 'tools', 'group', 'moderation', 'misc', 'owner', 'hidden'
            ]

            let menuText = ''
            let totalCommands = 0

            // Iterasi setiap kategori sesuai urutan
            for (const category of categoryOrder) {
                const plugins = categories[category]
                if (!plugins || plugins.length === 0 || category.toUpperCase() === 'HIDDEN') continue

                const icon = categoryIcons[category] || '📁'
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

                menuText += `\n╭─「 ${icon} ${categoryName.toUpperCase()} 」\n`

                // Tambahkan setiap command dengan format yang lebih rapi
                for (let i = 0; i < plugins.length; i++) {
                    const plugin = plugins[i]
                    const cmdList = Array.isArray(plugin.commands) ?
                        [plugin.commands[0]] :
                        plugin.commands

                    const isLast = i === plugins.length - 1
                    const prefix = isLast ? '└─' : '├─'
                    const subPrefix = isLast ? '   ' : '│  '

                    menuText += `${prefix} .${cmdList[0]}\n`
                    totalCommands++
                }

                menuText += '╰──────────────────\n'
            }

            const time = new Date()
            const hours = time.getHours()
            let greeting = ''
            if (hours >= 4 && hours < 11) greeting = 'Pagi'
            else if (hours >= 11 && hours < 15) greeting = 'Siang'
            else if (hours >= 15 && hours < 18) greeting = 'Sore'
            else greeting = 'Malam'

            // Footer dengan informasi tambahan
            const footer = `\n📊 *STATISTIK MENU*
├ Total Kategori: ${Object.keys(categories).filter(cat => categories[cat] && categories[cat].length > 0).length}
├ Total Commands: ${totalCommands}
├ Prefix: .
├ Mode: ${globalThis.botMode || 'Public'}
╰──────────────────

💡 *TIPS PENGGUNAAN*
├ Ketik !help <command> untuk detail
├ Contoh: !help play
├ Reply pesan dengan command untuk input
├ Gunakan bot dengan bijak! 🤖

⏰ *DICARI PADA:* ${new Date().toLocaleString('id-ID')}`

            await sock.sendMessage(m.chat, {
                image: await fetch('https://files.catbox.moe/zpjs9i.jpeg'),
                caption: `╭─「 🎯 KANATA BOT 」\n` +
                    `├ Selamat ${greeting} 👋\n` +
                    `├ Hai @${noTel}\n` +
                    `│\n` +
                    `├ Berikut adalah daftar menu\n` +
                    `├ yang tersedia untuk Anda:\n` +
                    `${menuText}` +
                    `${footer}`,
                contextInfo: {
                    mentionedJid: [m.sender],
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: globalThis.newsLetterJid,
                        newsletterName: '乂 Powered By : Roy 乂',
                        serverMessageId: -1
                    },
                    forwardingScore: 999,
                    externalAdReply: {
                        title: '乂 Kanata V3 Menu 乂',
                        body: 'Welcome to Kanata Universe!',
                        thumbnailUrl: globalThis.ppUrl,
                        sourceUrl: 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m',
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                },
            }, { quoted: m })

        } catch (error) {
            console.error('Error in help:', error)
            await m.reply('❌ Terjadi kesalahan saat memuat menu')
        }
    }
}

export default handler