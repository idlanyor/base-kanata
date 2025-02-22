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
            if (!args) {
                await m.reply('📋 Format: !kick @user')
                return
            }

            const userJid = args.replace('@', '') + '@s.whatsapp.net'
            await sock.groupParticipantsUpdate(id, [userJid], 'remove')
            await m.reply(`✅ Berhasil mengeluarkan @${args.replace('@', '')}`)

        } catch (error) {
            console.error('Error in kick:', error)
            await m.reply('❌ Gagal mengeluarkan member')
        }
    }
}

export default handler
