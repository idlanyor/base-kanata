
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
            if (!args) {
                await m.reply('📋 Format: !promote @user')
                return
            }

            const userJid = args.replace('@', '') + '@s.whatsapp.net'
            await sock.groupParticipantsUpdate(id, [userJid], 'promote')
            await m.reply(`✅ Berhasil menjadikan @${args.replace('@', '')} sebagai Admin`)

        } catch (error) {
            console.error('Error in promote:', error)
            await m.reply('❌ Gagal menaikkan pangkat member')
        }
    }
}

export default handler
