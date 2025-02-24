import Database from '../../helper/database.js'

export const handler = {
    command: 'kick',
    tags: ['admin', 'group'],
    help: 'Mengeluarkan member dari grup',
    isAdmin: true,
    isBotAdmin: true,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, id, args }) => {
        try {
            let userJid
            
            if (m.quoted) {
                userJid = m.quoted.participant
            }
            else if (args) {
                userJid = args.replace('@', '') + '@s.whatsapp.net'
            }
            else {
                await m.reply('📋 Format: !kick @user atau reply pesan user')
                return
            }

            await sock.groupParticipantsUpdate(id, [userJid], 'remove')
            await m.reply(`✅ Berhasil mengeluarkan @${userJid.split('@')[0]}`)

        } catch (error) {
            console.error('Error in kick:', error)
            await m.reply('❌ Gagal mengeluarkan member')
        }
    }
}

export default handler
