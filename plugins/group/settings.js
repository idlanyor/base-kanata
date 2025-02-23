import Database from '../../helper/database.js'

export const handler = {
    command: ['groupset', 'setgroup', 'settings'],
    tags: ['group'],
    help: 'Mengatur fitur grup (antispam/antipromosi/antilink/antitoxic)',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    exec: async ({ sock, m, args }) => {
        try {
            const group = await Database.getGroup(m.chat)
            
            // Jika tidak ada argumen, tampilkan status saat ini
            if (!args) {
                const status = `*GROUP SETTINGS*\n\n` +
                    `📛 Anti Spam: ${group.antiSpam ? '✅' : '❌'}\n` +
                    `🚫 Anti Promosi: ${group.antiPromote ? '✅' : '❌'}\n` +
                    `🔗 Anti Link: ${group.antiLink ? '✅' : '❌'}\n` +
                    `🤬 Anti Toxic: ${group.antiToxic ? '✅' : '❌'}\n\n` +
                    `Cara penggunaan:\n` +
                    `!settings <fitur> <on/off>\n\n` +
                    `Contoh:\n` +
                    `!settings antispam on`

                await sock.sendMessage(m.chat, {
                    text: status,
                    contextInfo: {
                        externalAdReply: {
                            title: '⚙️ Group Settings',
                            body: 'Klik untuk info lebih lanjut',
                            thumbnailUrl: `${globalThis.ppUrl}`,
                            sourceUrl: `${globalThis.newsletterUrl}`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                })
                return
            }

            // Parse argumen
            const [feature, state] = args.toLowerCase().split(' ')
            
            if (!['antispam', 'antipromote', 'antilink', 'antitoxic'].includes(feature)) {
                await m.reply('❌ Fitur tidak valid!\n\n' +
                    'Fitur yang tersedia:\n' +
                    '- antispam\n' +
                    '- antipromote\n' +
                    '- antilink\n' +
                    '- antitoxic')
                return
            }

            if (!['on', 'off'].includes(state)) {
                await m.reply('❌ Status tidak valid! Gunakan on/off')
                return
            }

            // Update database
            const updateData = {
                antiSpam: feature === 'antispam' ? state === 'on' : group.antiSpam,
                antiPromote: feature === 'antipromote' ? state === 'on' : group.antiPromote,
                antiLink: feature === 'antilink' ? state === 'on' : group.antiLink,
                antiToxic: feature === 'antitoxic' ? state === 'on' : group.antiToxic
            }

            await Database.updateGroup(m.chat, updateData)

            // Kirim konfirmasi
            await sock.sendMessage(m.chat, {
                text: `✅ Berhasil mengubah ${feature} menjadi ${state}`,
                contextInfo: {
                    externalAdReply: {
                        title: '⚙️ Settings Updated',
                        body: `${feature} is now ${state}`,
                        thumbnailUrl: `${globalThis.ppUrl}`,
                        sourceUrl: `${globalThis.newsletterUrl}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })

        } catch (error) {
            console.error('Error in settings:', error)
            await m.reply('❌ Terjadi kesalahan saat mengubah pengaturan')
        }
    }
} 