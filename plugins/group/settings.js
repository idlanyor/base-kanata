import Database from '../../helper/database.js'

export const handler = {
    command: ['groupset', 'setgroup', 'settings'],
    tags: ['group'],
    help: 'Mengatur fitur grup (welcome/leave/antispam/antipromosi/antilink/antitoxic)',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    exec: async ({ sock, m, args }) => {
        try {
            const group = await Database.getGroup(m.chat)
            
            if (!args) {
                const status = `╭─「 *GROUP SETTINGS* 」
├ 👋 *Welcome:* ${group.welcome ? '✅' : '❌'}
├ 👋 *Leave:* ${group.leave ? '✅' : '❌'}
├ 📛 *Anti Spam:* ${group.antiSpam ? '✅' : '❌'}
  ├─ *Warning:* ${group.antiSpam ? '3x Kick' : '-'}
├ 🚫 *Anti Promosi:* ${group.antiPromote ? '✅' : '❌'}
  ├─ *Warning:* ${group.antiPromote ? '3x Kick' : '-'}
├ 🔗 *Anti Link:* ${group.antiLink ? '✅' : '❌'}
  ├─ *Warning:* ${group.antiLink ? '3x Kick' : '-'}
├ 🤬 *Anti Toxic:* ${group.antiToxic ? '✅' : '❌'}
  ├─ *Warning:* ${group.antiToxic ? '5x Kick' : '-'}
│
├ 📝 *Cara mengubah:*
├ !settings <fitur> <on/off>
│
├ 📌 *Fitur tersedia:*
├ • welcome
├ • leave 
├ • antispam
├ • antipromote
├ • antilink
├ • antitoxic
╰──────────────────`

                await sock.sendMessage(m.chat, {
                    text: status,
                    contextInfo: {
                        externalAdReply: {
                            title: "⚙️ Group Settings",
                            body: "Klik untuk info lebih lanjut",
                            thumbnailUrl: `${globalThis.ppUrl}`,
                            sourceUrl: `${globalThis.newsletterUrl}`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                })
                return
            }

            const [feature, state] = args.toLowerCase().split(' ')
            
            if (!['welcome', 'leave', 'antispam', 'antipromote', 'antilink', 'antitoxic'].includes(feature)) {
                await m.reply('❌ Fitur tidak valid!')
                return
            }

            if (!['on', 'off'].includes(state)) {
                await m.reply('❌ Status tidak valid! Gunakan on/off')
                return
            }

            const updateData = {
                welcome: feature === 'welcome' ? state === 'on' : group.welcome,
                leave: feature === 'leave' ? state === 'on' : group.leave,
                antiSpam: feature === 'antispam' ? state === 'on' : group.antiSpam,
                antiPromote: feature === 'antipromote' ? state === 'on' : group.antiPromote,
                antiLink: feature === 'antilink' ? state === 'on' : group.antiLink,
                antiToxic: feature === 'antitoxic' ? state === 'on' : group.antiToxic
            }

            await Database.updateGroup(m.chat, updateData)

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

