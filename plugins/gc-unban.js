import Group from '../database/models/Group.js'

export const handler = {
    command: ['unban', 'unblock'],
    help: 'Unban a member from the group',
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
                return await m.reply('❌ *Invalid Usage*\nPlease mention a user to unban.\n\nUsage: !unban @user')
            }

            const groupId = m.chat

            // Check if member is banned
            if (!(await Group.isMemberBanned(groupId, targetJid))) {
                return await m.reply('❌ *Not Banned*\nThis member is not banned from the group.')
            }

            // Add reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            try {
                // Unban the member
                await Group.unbanMember(groupId, targetJid)
                
                const unbanMsg = `✅ *Member Unbanned Successfully*
                
👤 *User:* @${targetJid.split('@')[0]}
👮 *Unbanned by:* @${m.sender.split('@')[0]}
🕒 *Time:* ${new Date().toLocaleString('id-ID')}

The member has been unbanned and can now rejoin the group.`

                await m.reply(unbanMsg)
                
                // Add success reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                })

            } catch (error) {
                console.error('Unban error:', error)
                await m.reply('❌ *Unban Failed*\nUnable to unban the member.')
                
                // Add error reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                })
            }

        } catch (error) {
            console.error('Unban command error:', error)
            await m.reply('❌ *Error*\nFailed to execute unban command. Please try again.')
        }
    }
}

export default handler