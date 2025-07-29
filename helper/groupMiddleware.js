import Group from '../database/models/Group.js'

// Spam tracking
const spamTracker = new Map()

export async function groupModerationMiddleware(sock, m, next) {
    try {
        // Only process group messages
        if (!m.isGroup) {
            return next()
        }

        const groupId = m.chat
        const settings = await Group.getSettings(groupId)
        
        // Track member activity
        await Group.addMember(groupId, m.sender, {
            name: m.pushName || 'Unknown',
            lastSeen: new Date().toISOString()
        })

        // Check if member is banned
        if (await Group.isMemberBanned(groupId, m.sender)) {
            await m.reply('🚫 *Access Denied*\nYou are banned from this group.')
            return
        }

        // Anti-spam check
        if (settings.antiSpam && !m.isAdmin) {
            const spamKey = `${groupId}-${m.sender}`
            const now = Date.now()
            
            if (!spamTracker.has(spamKey)) {
                spamTracker.set(spamKey, {
                    messages: [],
                    lastWarning: 0
                })
            }
            
            const userSpam = spamTracker.get(spamKey)
            userSpam.messages.push(now)
            
            // Remove old messages outside time window
            userSpam.messages = userSpam.messages.filter(
                time => now - time < settings.spamTimeWindow
            )
            
            if (userSpam.messages.length >= settings.spamThreshold) {
                const action = await Group.shouldTakeAction(groupId, m.sender, 'spam')
                
                if (action.action === 'warn') {
                    await Group.warnMember(groupId, m.sender, 'Spam detected')
                    await m.reply('⚠️ *Spam Warning*\nPlease slow down your messages.')
                } else if (action.action === 'kick') {
                    await Group.warnMember(groupId, m.sender, 'Spam - Auto kick')
                    await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                    await m.reply(`🚫 *Auto Kick*\n@${m.sender.split('@')[0]} has been kicked for spam.`)
                } else if (action.action === 'ban') {
                    await Group.banMember(groupId, m.sender, 'Spam - Auto ban')
                    await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                    await m.reply(`🚫 *Auto Ban*\n@${m.sender.split('@')[0]} has been banned for spam.`)
                }
                
                // Clear spam messages
                userSpam.messages = []
            }
        }

        // Anti-link check
        if (settings.antiLink && !m.isAdmin && m.type === 'text') {
            const message = m.message.conversation || ''
            const urlRegex = /(https?:\/\/[^\s]+)/g
            const urls = message.match(urlRegex)
            
            if (urls) {
                const hasWhitelistedLink = urls.some(url => 
                    settings.whitelistLinks.some(whitelist => 
                        url.includes(whitelist)
                    )
                )
                
                if (!hasWhitelistedLink) {
                    const action = await Group.shouldTakeAction(groupId, m.sender, 'link')
                    
                    if (action.action === 'warn') {
                        await Group.warnMember(groupId, m.sender, 'Link sharing not allowed')
                        await m.reply('⚠️ *Link Warning*\nSharing links is not allowed in this group.')
                    } else if (action.action === 'kick') {
                        await Group.warnMember(groupId, m.sender, 'Link - Auto kick')
                        await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                        await m.reply(`🚫 *Auto Kick*\n@${m.sender.split('@')[0]} has been kicked for sharing links.`)
                    } else if (action.action === 'ban') {
                        await Group.banMember(groupId, m.sender, 'Link - Auto ban')
                        await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                        await m.reply(`🚫 *Auto Ban*\n@${m.sender.split('@')[0]} has been banned for sharing links.`)
                    }
                    
                    // Delete the message
                    await sock.sendMessage(groupId, { delete: m.key })
                    return
                }
            }
        }

        // Anti-toxic check
        if (settings.antiToxic && !m.isAdmin && m.type === 'text') {
            const message = m.message.conversation || ''
            const hasToxicWord = settings.toxicWords.some(word => 
                message.toLowerCase().includes(word.toLowerCase())
            )
            
            if (hasToxicWord) {
                const action = await Group.shouldTakeAction(groupId, m.sender, 'toxic')
                
                if (action.action === 'warn') {
                    await Group.warnMember(groupId, m.sender, 'Toxic language detected')
                    await m.reply('⚠️ *Toxic Warning*\nPlease use appropriate language.')
                } else if (action.action === 'kick') {
                    await Group.warnMember(groupId, m.sender, 'Toxic - Auto kick')
                    await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                    await m.reply(`🚫 *Auto Kick*\n@${m.sender.split('@')[0]} has been kicked for toxic language.`)
                } else if (action.action === 'ban') {
                    await Group.banMember(groupId, m.sender, 'Toxic - Auto ban')
                    await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                    await m.reply(`🚫 *Auto Ban*\n@${m.sender.split('@')[0]} has been banned for toxic language.`)
                }
                
                // Delete the message
                await sock.sendMessage(groupId, { delete: m.key })
                return
            }
        }

        // Anti-media check
        if (settings.antiMedia && !m.isAdmin && settings.mediaTypes.includes(m.type)) {
            const action = await Group.shouldTakeAction(groupId, m.sender, 'media')
            
            if (action.action === 'warn') {
                await Group.warnMember(groupId, m.sender, 'Media sharing not allowed')
                await m.reply('⚠️ *Media Warning*\nSharing media is not allowed in this group.')
            } else if (action.action === 'kick') {
                await Group.warnMember(groupId, m.sender, 'Media - Auto kick')
                await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                await m.reply(`🚫 *Auto Kick*\n@${m.sender.split('@')[0]} has been kicked for sharing media.`)
            } else if (action.action === 'ban') {
                await Group.banMember(groupId, m.sender, 'Media - Auto ban')
                await sock.groupParticipantsUpdate(groupId, [m.sender], 'remove')
                await m.reply(`🚫 *Auto Ban*\n@${m.sender.split('@')[0]} has been banned for sharing media.`)
            }
            
            // Delete the message
            await sock.sendMessage(groupId, { delete: m.key })
            return
        }

        // Update message statistics
        await Group.incrementStat(groupId, 'messages')
        
        // Continue to next middleware
        next()
        
    } catch (error) {
        console.error('Group moderation middleware error:', error)
        next()
    }
}

// Welcome/Goodbye handler
export async function handleGroupEvents(sock, event) {
    try {
        if (event.action === 'add' && event.participants.length > 0) {
            const groupId = event.id
            const settings = await Group.getSettings(groupId)
            
            if (settings.welcome) {
                for (const participant of event.participants) {
                    const welcomeMsg = settings.welcomeMessage
                        .replace('@user', `@${participant.split('@')[0]}`)
                        .replace('@group', event.subject || 'Group')
                    
                    await sock.sendMessage(groupId, {
                        text: `🎉 *Welcome!*\n\n${welcomeMsg}`
                    })
                }
            }
        }
        
        if (event.action === 'remove' && event.participants.length > 0) {
            const groupId = event.id
            const settings = await Group.getSettings(groupId)
            
            if (settings.goodbye) {
                for (const participant of event.participants) {
                    const goodbyeMsg = settings.goodbyeMessage
                        .replace('@user', `@${participant.split('@')[0]}`)
                        .replace('@group', event.subject || 'Group')
                    
                    await sock.sendMessage(groupId, {
                        text: `👋 *Goodbye!*\n\n${goodbyeMsg}`
                    })
                }
            }
        }
        
    } catch (error) {
        console.error('Group events handler error:', error)
    }
}

// Auto-delete commands
export async function handleAutoDelete(sock, m) {
    try {
        if (!m.isGroup) return
        
        const groupId = m.chat
        const settings = await Group.getSettings(groupId)
        
        if (settings.autoDelete && settings.deleteCommands && m.isCommand) {
            setTimeout(async () => {
                try {
                    await sock.sendMessage(groupId, { delete: m.key })
                } catch (error) {
                    console.error('Auto delete error:', error)
                }
            }, settings.deleteCommandsDelay)
        }
        
    } catch (error) {
        console.error('Auto delete handler error:', error)
    }
}

// Logging handler
export async function handleGroupLogging(sock, m, action, details = {}) {
    try {
        if (!m.isGroup) return
        
        const groupId = m.chat
        const settings = await Group.getSettings(groupId)
        
        if (settings.enableLogs && settings.logGroup) {
            const logMessage = `📊 *Group Log*\n\n` +
                `🏷️ *Group:* ${m.chat}\n` +
                `👤 *User:* @${m.sender.split('@')[0]}\n` +
                `⚡ *Action:* ${action}\n` +
                `📝 *Details:* ${JSON.stringify(details, null, 2)}\n` +
                `🕒 *Time:* ${new Date().toLocaleString('id-ID')}`
            
            await sock.sendMessage(settings.logGroup, { text: logMessage })
        }
        
    } catch (error) {
        console.error('Group logging error:', error)
    }
}