import Database from '../../helper/database.js'

export const handler = {
    command: 'demote',
    tags: ['admin', 'group'],
    help: 'Menurunkan pangkat anggota grup dari Admin',
    isAdmin: true,
    isBotAdmin: true,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, id, args }) => {
        try {
            if (!args) {
                await m.reply('📋 Format: !demote @user')
                return
            }

            const userJid = args.replace('@', '') + '@s.whatsapp.net'

            // Cek apakah target adalah admin
            const groupMetadata = await sock.groupMetadata(id)
            const isTargetAdmin = groupMetadata.participants.find(p => p.id === userJid)?.admin
            if (!isTargetAdmin) {
                await m.reply('❌ Gagal: Pengguna yang ditag bukan admin!')
                return
            }

            // Cek apakah target adalah owner grup
            if (isTargetAdmin === 'superadmin') {
                await m.reply('❌ Gagal: Tidak dapat menurunkan pangkat owner grup!')
                return
            }

            try {
                await sock.groupParticipantsUpdate(id, [userJid], 'demote')
                
                // Update database setelah demote berhasil
                const group = await m.getGroup()
                if (group?.admins) {
                    group.admins = group.admins.filter(admin => admin !== userJid)
                    await Database.updateGroup(id, {
                        admins: group.admins
                    })
                }
                
                await m.reply(`✅ Berhasil menurunkan @${args.replace('@', '')} dari admin`)
            } catch (updateError) {
                if (updateError.toString().includes('forbidden')) {
                    await m.reply('❌ Gagal: Bot tidak memiliki izin untuk menurunkan admin!')
                } else if (updateError.toString().includes('not-authorized')) {
                    await m.reply('❌ Gagal: Bot harus menjadi admin untuk menurunkan admin!')
                } else {
                    throw updateError
                }
            }
        } catch (error) {
            console.error('Error in demote:', error)
            await m.reply('❌ Terjadi kesalahan internal')
        }
    }
}

export default handler
