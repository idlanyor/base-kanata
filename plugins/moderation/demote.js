export const handler = {
    command: ['demote', 'removeadmin'],
    help: 'Demote an admin to member',
    tags: ['moderation'],
    isAdmin: true,
    isBotAdmin: true,
    isOwner: false,
    isGroup: true,
    exec: async ({ sock, m, args }) => {
        try {
            if (!m.isGroup) {
                return await m.reply('❌ *Group Only*\nThis command can only be used in groups.')
            }

            if (!m.isAdmin) {
                return await m.reply('❌ *Admin Only*\nOnly group admins can use this command.')
            }

            const targetJid = m.mentionedJid?.[0]
            if (!targetJid) {
                return await m.reply('❌ *Invalid Usage*\nPlease mention a user to demote.\n\nUsage: !demote @user')
            }

            if (targetJid === m.sender) {
                return await m.reply('❌ *Cannot Demote Self*\nYou cannot demote yourself.')
            }

            if (targetJid === sock.user.id) {
                return await m.reply('❌ *Cannot Demote Bot*\nYou cannot demote the bot.')
            }

            // Check if target is admin
            const participants = await sock.groupMetadata(m.chat)
            const targetParticipant = participants.participants.find(p => p.id === targetJid)
            
            if (!targetParticipant?.admin) {
                return await m.reply('❌ *Not Admin*\nThis member is not an admin.')
            }

            // Add reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            try {
                // Demote the member
                await sock.groupParticipantsUpdate(m.chat, [targetJid], 'demote')
                
                const demoteMsg = `👤 *Admin Demoted Successfully*
                
👤 *User:* @${targetJid.split('@')[0]}
👮 *Demoted by:* @${m.sender.split('@')[0]}
🕒 *Time:* ${new Date().toLocaleString('id-ID')}

The admin has been demoted to member.`

                await m.reply(demoteMsg)
                
                // Add success reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                })

            } catch (error) {
                console.error('Demote error:', error)
                await m.reply('❌ *Demote Failed*\nUnable to demote the admin. The bot might lack permission.')
                
                // Add error reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                })
            }

        } catch (error) {
            console.error('Demote command error:', error)
            await m.reply('❌ *Error*\nFailed to execute demote command. Please try again.')
        }
    }
}

export default handler