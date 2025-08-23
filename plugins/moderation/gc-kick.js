import Group from '../../database/models/Group.js'

export const handler = {
    command: ['kick', 'remove'],
    help: 'Kick a member from the group',
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
                return await m.reply('❌ *Invalid Usage*\nPlease mention a user to kick.\n\nUsage: !kick @user [reason]')
            }

            if (targetJid === m.sender) {
                return await m.reply('❌ *Cannot Kick Self*\nYou cannot kick yourself.')
            }

            if (targetJid === sock.user.id) {
                return await m.reply('❌ *Cannot Kick Bot*\nYou cannot kick the bot.')
            }

            // Check if target is admin
            const participants = await sock.groupMetadata(m.chat)
            const targetParticipant = participants.participants.find(p => p.id === targetJid)
            
            if (targetParticipant?.admin) {
                return await m.reply('❌ *Cannot Kick Admin*\nYou cannot kick an admin.')
            }

            const reason = args.split(' ').slice(1).join(' ') || 'No reason provided'
            const groupId = m.chat

            // Add reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            try {
                // Kick the member
                await sock.groupParticipantsUpdate(groupId, [targetJid], 'remove')
                
                // Update group stats
                await Group.incrementStat(groupId, 'kicks')
                
                // Log the action
                await Group.warnMember(groupId, targetJid, `Kicked: ${reason}`)
                
                const kickMsg = `🚫 *Member Kicked Successfully*
                
👤 *User:* @${targetJid.split('@')[0]}
👮 *Kicked by:* @${m.sender.split('@')[0]}
📝 *Reason:* ${reason}
🕒 *Time:* ${new Date().toLocaleString('id-ID')}

The member has been removed from the group.`

                await m.reply(kickMsg)
                
                // Add success reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                })

            } catch (error) {
                console.error('Kick error:', error)
                await m.reply('❌ *Kick Failed*\nUnable to kick the member. They might be an admin or the bot lacks permission.')
                
                // Add error reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                })
            }

        } catch (error) {
            console.error('Kick command error:', error)
            await m.reply('❌ *Error*\nFailed to execute kick command. Please try again.')
        }
    }
}

export default handler