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
                userJid = m.quoted.sender
            }
            // Jika tidak ada quoted, cek mention/args
            else if (args) {
                let mention = args.match(/\d{5,}/)
                if (mention) {
                    userJid = mention[0] + '@s.whatsapp.net'
                }
            }
            if (!userJid) {
                await m.reply('📋 Format: !promote @user atau reply pesan user')
                return
            }
            // Cegah promote bot sendiri
            if (userJid === sock.user.id) {
                await m.reply('❌ Tidak bisa promote bot sendiri!')
                return
            }
            // Cek apakah user sudah admin
            const metadata = await m.groupMetadata
            const target = metadata.participants.find(p => p.id === userJid)
            if (target?.admin) {
                await m.reply('❌ User sudah menjadi admin!')
                return
            }
            await sock.groupParticipantsUpdate(id, [userJid], 'promote')
            await m.reply(`✅ Berhasil menjadikan @${userJid.split('@')[0]} sebagai Admin`, false, true)
        } catch (error) {
            console.error('Error in promote:', error)
            await m.reply('❌ Gagal menaikkan pangkat member')
        }
    }
}

export default handler
