import Database from '../helper/database.js'

export const handler = {
    command: 'hidetag',
    tags: ['admin', 'group'],
    help: 'Tag semua anggota group secara tersembunyi',
    isAdmin: true,
    isBotAdmin: false,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, id, args }) => {
        try {
            const group = await m.getGroup()
            
            let teks = args || ''
            await sock.sendMessage(id, {
                text: teks,
                mentions: group.members
            }, { quoted: m })

        } catch (error) {
            console.error('Error in hidetag:', error)
            await m.reply('❌ Gagal mengirim hidetag')
        }
    }
}

export default handler
