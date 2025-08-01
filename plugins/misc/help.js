import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import pkg from '@whiskeysockets/baileys'
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
export function getMainCases() {
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
    command: ['help3', 'h3', 'menu3'],
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
                isOwner: c.command === '#' || c.command === '>', // Perintah exec dan eval hanya untuk owner
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

            // Jika ada args (dari klik list), tampilkan detail command
            if (args) {
                const searchCmd = args.toLowerCase()
                let found = false

                for (const [category, plugins] of Object.entries(categories)) {
                    for (const plugin of plugins) {
                        const cmdList = Array.isArray(plugin.commands) ? 
                            plugin.commands : [plugin.commands]
                            
                        if (cmdList.includes(searchCmd)) {
                            const icon = categoryIcons[category] || '📁'
                            let detailMenu = `╭─「 📚 COMMAND DETAIL 」\n` +
                                            `├ Command: .${cmdList.join(', ')}\n` +
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
                                            `├ .${cmdList[0]} <parameter>\n` +
                                            `├ Reply: .${cmdList[0]}\n` +
                                            `╰──────────────────`

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

            let sections = []
            let totalCommands = 0

            // Iterasi setiap kategori sesuai urutan yang diinginkan
            for (const category of categoryOrder) {
                const plugins = categories[category]
                if (!plugins || plugins.length === 0 || category.toUpperCase() === 'HIDDEN') continue

                const icon = categoryIcons[category] || '📁'
                let rows = []
                
                // Tambahkan setiap command sebagai row
                for (const plugin of plugins) {
                    const cmdList = Array.isArray(plugin.commands) ? plugin.commands : [plugin.commands]
                    
                    for (const cmd of cmdList) {
                        rows.push({
                            title: `.${cmd}`,
                            id: `help3 ${cmd}`
                        })
                        totalCommands++
                    }
                }

                // Tambahkan section untuk kategori ini
                if (rows.length > 0) {
                    sections.push({
                        title: `${icon} ${category.toUpperCase()}`,
                        rows: rows
                    })
                }
            }

            const time = new Date()
            const hours = time.getHours()
            let greeting = ''
            if (hours >= 4 && hours < 11) greeting = 'Pagi'
            else if (hours >= 11 && hours < 15) greeting = 'Siang'
            else if (hours >= 15 && hours < 18) greeting = 'Sore'
            else greeting = 'Malam'

            // Footer dengan informasi tambahan
            const footer = `📊 *STATISTIK MENU*
├ Total Kategori: ${sections.length}
├ Total Commands: ${totalCommands}
├ Prefix: .
├ Mode: ${globalThis.botMode || 'Public'}
╰──────────────────

💡 *TIPS PENGGUNAAN*
├ Ketik .help3 <command> untuk detail
├ Contoh: .help3 play
├ Reply pesan dengan command untuk input
├ Gunakan bot dengan bijak! 🤖

⏰ *DICARI PADA:* ${new Date().toLocaleString('id-ID')}`

            await sock.sendMessage(m.chat, {
                image: { url: `${globalThis.ppUrl}` },
                caption: `╭─「 🎯 KANATA BOT 」\n` +
                         `├ Selamat ${greeting} 👋\n` +
                         `├ Hai @${noTel}\n` +
                         `│\n` +
                         `├ Silahkan pilih kategori menu\n` +
                         `├ yang ingin ditampilkan:\n` +
                         `${footer}`,
                footer: '© 2024 Kanata Bot • Created by Roy',
                buttons: [
                    {
                        buttonId: 'action',
                        buttonText: {
                            displayText: '📋 Pilih Kategori'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: '📚 KATEGORI MENU',
                                sections
                            })
                        }
                    }
                ],
                headerType: 1,
                viewOnce: true,
                contextInfo: {
                    mentionedJid: [sender],
                    isForwarded: true,
                    forwardingScore: 999,
                    externalAdReply: {
                        title: '乂 Kanata Bot Menu 乂',
                        body: 'Interactive Menu System',
                        thumbnailUrl: `${globalThis.ppUrl}`,
                        sourceUrl: `${globalThis.newsletterUrl}`,
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