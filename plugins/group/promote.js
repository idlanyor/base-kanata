export const handler = {
    command: 'promote',
    tags: ['admin', 'group'],
    help: 'Menaikkan pangkat anggota grup menjadi Admin',
    isAdmin: true,
    isBotAdmin: true, 
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, id, args }) => {
        try {
            let userJid
            
            // Cek jika ada quoted message
            if (m.quoted) {
                userJid = m.quoted.participant
            }
            // Jika tidak ada quoted, cek mention
            else if (args) {
                userJid = args.replace('@', '') + '@s.whatsapp.net'
            }
            else {
                await m.reply('📋 Format: !promote @user atau reply pesan user')
                return
            }

            await sock.groupParticipantsUpdate(id, [userJid], 'promote')
            await m.reply(`✅ Berhasil menjadikan @${userJid.split('@')[0]} sebagai Admin`)

        } catch (error) {
            console.error('Error in promote:', error)
            await m.reply('❌ Gagal menaikkan pangkat member')
        }
    }
}

export default handler
