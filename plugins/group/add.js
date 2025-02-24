
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
            // if (!args) {
            //     await m.reply('📋 Format: !add 628xxx / reply kontak yang ingin ditambahkan')
            //     return
            // }
            let userJid
            if (m.quoted) {
                userJid = m.quoted?.message?.contactMessage?.vcard.match(/waid=(\d+)/)[1] + '@s.whatsapp.net'
            } else if (args) {
                userJid = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            } else {
                await m.reply('📋 Format: !add 628xxx / reply kontak yang ingin ditambahkan')
                return
            }
            console.log(userJid)


            await sock.groupParticipantsUpdate(id, [userJid], 'add')
            await m.reply(`✅ Berhasil menambahkan @${userJid.replace(/[^0-9]/g, '').split('@')[0]} ke grup`)

        } catch (error) {
            console.error('Error in add:', error)
            await m.reply('❌ Gagal menambahkan member')
        }
    }
}

export default handler
