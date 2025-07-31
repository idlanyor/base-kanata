import Group from '../../database/models/Group.js'

export const handler = {
    command: ['ban', 'block'],
    help: 'Ban a member from the group',
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
                return await m.reply('❌ *Invalid Usage*\nPlease mention a user to ban.\n\nUsage: !ban @user [reason]')
            }

            if (targetJid === m.sender) {
                return await m.reply('❌ *Cannot Ban Self*\nYou cannot ban yourself.')
            }

            if (targetJid === sock.user.id) {
                return await m.reply('❌ *Cannot Ban Bot*\nYou cannot ban the bot.')
            }

            // Check if target is admin
            const participants = await sock.groupMetadata(m.chat)
            const targetParticipant = participants.participants.find(p => p.id === targetJid)
            
            if (targetParticipant?.admin) {
                return await m.reply('❌ *Cannot Ban Admin*\nYou cannot ban an admin.')
            }

            const reason = args.split(' ').slice(1).join(' ') || 'No reason provided'
            const groupId = m.chat

            // Check if already banned
            if (await Group.isMemberBanned(groupId, targetJid)) {
                return await m.reply('❌ *Already Banned*\nThis member is already banned from the group.')
            }

            // Add reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            try {
                // Ban the member
                await Group.banMember(groupId, targetJid, reason)
                
                // Kick them from the group
                await sock.groupParticipantsUpdate(groupId, [targetJid], 'remove')
                
                const banMsg = `🚫 *Member Banned Successfully*
                
👤 *User:* @${targetJid.split('@')[0]}
👮 *Banned by:* @${m.sender.split('@')[0]}
📝 *Reason:* ${reason}
🕒 *Time:* ${new Date().toLocaleString('id-ID')}

The member has been banned and removed from the group.
They cannot rejoin unless unbanned by an admin.`

                await m.reply(banMsg)
                
                // Add success reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                })

            } catch (error) {
                console.error('Ban error:', error)
                await m.reply('❌ *Ban Failed*\nUnable to ban the member. They might be an admin or the bot lacks permission.')
                
                // Add error reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                })
            }

        } catch (error) {
            console.error('Ban command error:', error)
            await m.reply('❌ *Error*\nFailed to execute ban command. Please try again.')
        }
    }
}

export default handler