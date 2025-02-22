import Database from '../../helper/database.js'

export const handler = {
    command: 'tagall',
    tags: ['admin', 'group'],
    help: 'Tag semua anggota group',
    isAdmin: true,
    isBotAdmin: false,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, id, args }) => {
        try {
            const group = await m.getGroup()
            
            let teks = args ? args + '\n\n' : '\n'
            for (let member of group.members) {
                teks += `@${member.split('@')[0]}\n`
            }

            await sock.sendMessage(id, {
                text: teks,
                mentions: group.members
            }, { quoted: m })

        } catch (error) {
            console.error('Error in tagall:', error)
            await m.reply('❌ Gagal mengirim tagall')
        }
    }
}

export default handler
