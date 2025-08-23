export const handler = {
    command: ['promote', 'admin'],
    help: 'Promote a member to admin',
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
                return await m.reply('❌ *Invalid Usage*\nPlease mention a user to promote.\n\nUsage: !promote @user')
            }

            if (targetJid === m.sender) {
                return await m.reply('❌ *Cannot Promote Self*\nYou cannot promote yourself.')
            }

            if (targetJid === sock.user.id) {
                return await m.reply('❌ *Cannot Promote Bot*\nYou cannot promote the bot.')
            }

            // Check if target is already admin
            const participants = await sock.groupMetadata(m.chat)
            const targetParticipant = participants.participants.find(p => p.id === targetJid)
            
            if (targetParticipant?.admin) {
                return await m.reply('❌ *Already Admin*\nThis member is already an admin.')
            }

            // Add reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            try {
                // Promote the member
                await sock.groupParticipantsUpdate(m.chat, [targetJid], 'promote')
                
                const promoteMsg = `👑 *Member Promoted Successfully*
                
👤 *User:* @${targetJid.split('@')[0]}
👮 *Promoted by:* @${m.sender.split('@')[0]}
🕒 *Time:* ${new Date().toLocaleString('id-ID')}

The member has been promoted to admin.`

                await m.reply(promoteMsg)
                
                // Add success reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                })

            } catch (error) {
                console.error('Promote error:', error)
                await m.reply('❌ *Promote Failed*\nUnable to promote the member. The bot might lack permission.')
                
                // Add error reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                })
            }

        } catch (error) {
            console.error('Promote command error:', error)
            await m.reply('❌ *Error*\nFailed to execute promote command. Please try again.')
        }
    }
}

export default handler