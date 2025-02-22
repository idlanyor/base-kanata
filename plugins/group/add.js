import Database from '../../helper/database.js'

export const handler = {
    command: 'add',
    tags: ['admin', 'group'],
    help: 'Menambahkan member ke grup',
    isAdmin: true,
    isBotAdmin: true,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, id, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format: !add 628xxx')
                return
            }

            const userJid = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            await sock.groupParticipantsUpdate(id, [userJid], 'add')
            await m.reply(`✅ Berhasil menambahkan @${args.replace(/[^0-9]/g, '')}`)

        } catch (error) {
            console.error('Error in add:', error)
            await m.reply('❌ Gagal menambahkan member')
        }
    }
}

export default handler
