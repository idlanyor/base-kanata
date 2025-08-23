import Group from '../database/models/Group.js'

export const handler = {
    command: ['warn', 'warning'],
    help: 'Warn a member in the group',
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
                return await m.reply('❌ *Invalid Usage*\nPlease mention a user to warn.\n\nUsage: !warn @user [reason]')
            }

            if (targetJid === m.sender) {
                return await m.reply('❌ *Cannot Warn Self*\nYou cannot warn yourself.')
            }

            if (targetJid === sock.user.id) {
                return await m.reply('❌ *Cannot Warn Bot*\nYou cannot warn the bot.')
            }

            // Check if target is admin
            const participants = await sock.groupMetadata(m.chat)
            const targetParticipant = participants.participants.find(p => p.id === targetJid)
            
            if (targetParticipant?.admin) {
                return await m.reply('❌ *Cannot Warn Admin*\nYou cannot warn an admin.')
            }

            const reason = args.split(' ').slice(1).join(' ') || 'No reason provided'
            const groupId = m.chat

            // Add reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            try {
                // Warn the member
                await Group.warnMember(groupId, targetJid, reason)
                
                // Get warning count
                const warningCount = await Group.getMemberWarningsCount(groupId, targetJid)
                
                const warnMsg = `⚠️ *Member Warned Successfully*
                
👤 *User:* @${targetJid.split('@')[0]}
👮 *Warned by:* @${m.sender.split('@')[0]}
📝 *Reason:* ${reason}
⚠️ *Warnings:* ${warningCount}/3
🕒 *Time:* ${new Date().toLocaleString('id-ID')}

${warningCount >= 3 ? '🚫 *Auto-ban will be applied on next violation!*' : '⚠️ *Member will be auto-banned after 3 warnings.*'}`

                await m.reply(warnMsg)
                
                // Add success reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                })

            } catch (error) {
                console.error('Warn error:', error)
                await m.reply('❌ *Warn Failed*\nUnable to warn the member.')
                
                // Add error reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                })
            }

        } catch (error) {
            console.error('Warn command error:', error)
            await m.reply('❌ *Error*\nFailed to execute warn command. Please try again.')
        }
    }
}

export default handler