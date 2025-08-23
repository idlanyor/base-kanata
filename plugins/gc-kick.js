import Database from '../helper/database.js'

export const handler = {
    command: ['dor', 'kick'],
    tags: ['admin', 'group'],
    help: 'Mengeluarkan member dari grup\n\nFormat:\n- !kick @user1 @user2\n- !kick (reply pesan)',
    isAdmin: true,
    isBotAdmin: true,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, id, args }) => {
        try {
            let users = []
            
            // Handle quoted message
            if (m.quoted) {
                const quotedUser = m.quoted?.key?.participant
                if (quotedUser) users.push(quotedUser)
            }
            
            // Handle mentioned users
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                users.push(...m.mentionedJid)
            }
            // Handle manual input
            else if (args && !m.quoted) {
                const numbers = args.split(' ')
                users = numbers.map(num => num.replace('@', '').replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            }

            if (users.length === 0) {
                await m.reply('📋 Format: !kick @user1 @user2 atau reply pesan user')
                return
            }

            // Get group metadata
            const groupMeta = await sock.groupMetadata(id)
            const botNumber = sock.user.jid

            // Filter out invalid numbers and check permissions
            const validUsers = users.filter(user => {
                // Check if user is in group
                if (!groupMeta.participants.find(p => p.id === user)) {
                    m.reply(`❌ @${user.split('@')[0]} tidak ada dalam grup`)
                    return false
                }
                // Prevent kicking group creator
                if (user === groupMeta.owner) {
                    m.reply(`❌ Tidak dapat mengeluarkan owner grup`)
                    return false
                }
                // Prevent kicking the bot
                if (user === botNumber) {
                    m.reply(`❌ Tidak dapat mengeluarkan bot`)
                    return false
                }
                return true
            })

            if (validUsers.length === 0) {
                return
            }

            // Kick users
            await sock.groupParticipantsUpdate(id, validUsers, 'remove')
            
            // Send success message
            const kickedUsers = validUsers.map(user => `@${user.split('@')[0]}`).join(', ')
            await m.reply(`✅ Berhasil mengeluarkan ${kickedUsers}`)

        } catch (error) {
            console.error('Error in kick:', error)
            await m.reply('❌ Gagal mengeluarkan member: ' + error.message)
        }
    }
}

export default handler
