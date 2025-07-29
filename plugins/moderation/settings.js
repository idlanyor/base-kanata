import Group from '../../database/models/Group.js'

export const handler = {
    command: ['groupset', 'setgroup', 'groupsettings'],
    help: 'Configure group moderation settings',
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

            const groupId = m.chat
            const settings = await Group.getSettings(groupId)

            if (!args) {
                // Show current settings
                const settingsMsg = `⚙️ *Group Settings*

📋 *Basic Settings:*
• Welcome: ${settings.welcome ? '✅ On' : '❌ Off'}
• Goodbye: ${settings.goodbye ? '✅ On' : '❌ Off'}

🛡️ *Moderation Settings:*
• Anti-Spam: ${settings.antiSpam ? '✅ On' : '❌ Off'}
• Anti-Link: ${settings.antiLink ? '✅ On' : '❌ Off'}
• Anti-Toxic: ${settings.antiToxic ? '✅ On' : '❌ Off'}
• Anti-Media: ${settings.antiMedia ? '✅ On' : '❌ Off'}

📊 *Statistics:*
• Messages: ${settings.stats.messages}
• Commands: ${settings.stats.commands}
• Kicks: ${settings.stats.kicks}
• Bans: ${settings.stats.bans}
• Warnings: ${settings.stats.warnings}

💡 *Usage:*
!groupset <feature> <on/off> [options]

📋 *Available Features:*
• welcome - Welcome messages
• goodbye - Goodbye messages
• antispam - Anti-spam protection
• antilink - Anti-link protection
• antitoxic - Anti-toxic language
• antimedia - Anti-media sharing
• autodelete - Auto-delete commands
• logging - Enable logging

Example: !groupset welcome on "Welcome @user!"`

                return await m.reply(settingsMsg)
            }

            const [feature, action, ...options] = args.split(' ')
            
            switch (feature.toLowerCase()) {
                case 'welcome':
                    if (action === 'on') {
                        const message = options.join(' ') || 'Selamat datang @user di grup @group!'
                        await Group.setWelcome(groupId, true, message)
                        await m.reply(`✅ *Welcome Enabled*\nMessage: ${message}`)
                    } else if (action === 'off') {
                        await Group.setWelcome(groupId, false)
                        await m.reply('❌ *Welcome Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off')
                    }
                    break

                case 'goodbye':
                    if (action === 'on') {
                        const message = options.join(' ') || 'Selamat tinggal @user dari grup @group!'
                        await Group.setGoodbye(groupId, true, message)
                        await m.reply(`✅ *Goodbye Enabled*\nMessage: ${message}`)
                    } else if (action === 'off') {
                        await Group.setGoodbye(groupId, false)
                        await m.reply('❌ *Goodbye Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off')
                    }
                    break

                case 'antispam':
                    if (action === 'on') {
                        const threshold = parseInt(options[0]) || 5
                        const spamAction = options[1] || 'warn'
                        await Group.setAntiSpam(groupId, true, threshold, spamAction)
                        await m.reply(`✅ *Anti-Spam Enabled*\nThreshold: ${threshold} messages\nAction: ${spamAction}`)
                    } else if (action === 'off') {
                        await Group.setAntiSpam(groupId, false)
                        await m.reply('❌ *Anti-Spam Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off [threshold] [action]')
                    }
                    break

                case 'antilink':
                    if (action === 'on') {
                        const linkAction = options[0] || 'warn'
                        const whitelist = options.slice(1) || ['youtube.com', 'youtu.be', 'facebook.com', 'instagram.com', 'tiktok.com']
                        await Group.setAntiLink(groupId, true, linkAction, whitelist)
                        await m.reply(`✅ *Anti-Link Enabled*\nAction: ${linkAction}\nWhitelist: ${whitelist.join(', ')}`)
                    } else if (action === 'off') {
                        await Group.setAntiLink(groupId, false)
                        await m.reply('❌ *Anti-Link Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off [action] [whitelist...]')
                    }
                    break

                case 'antitoxic':
                    if (action === 'on') {
                        const toxicAction = options[0] || 'warn'
                        const toxicWords = options.slice(1) || ['anjing', 'bangsat', 'kontol', 'memek', 'babi', 'asu']
                        await Group.setAntiToxic(groupId, true, toxicWords, toxicAction)
                        await m.reply(`✅ *Anti-Toxic Enabled*\nAction: ${toxicAction}\nWords: ${toxicWords.join(', ')}`)
                    } else if (action === 'off') {
                        await Group.setAntiToxic(groupId, false)
                        await m.reply('❌ *Anti-Toxic Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off [action] [words...]')
                    }
                    break

                case 'antimedia':
                    if (action === 'on') {
                        const mediaAction = options[0] || 'warn'
                        const mediaTypes = options.slice(1) || ['image', 'video', 'audio', 'document']
                        await Group.setAntiMedia(groupId, true, mediaTypes, mediaAction)
                        await m.reply(`✅ *Anti-Media Enabled*\nAction: ${mediaAction}\nTypes: ${mediaTypes.join(', ')}`)
                    } else if (action === 'off') {
                        await Group.setAntiMedia(groupId, false)
                        await m.reply('❌ *Anti-Media Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off [action] [types...]')
                    }
                    break

                case 'autodelete':
                    if (action === 'on') {
                        const delay = parseInt(options[0]) || 30000
                        await Group.updateSetting(groupId, 'autoDelete', true)
                        await Group.updateSetting(groupId, 'deleteCommandsDelay', delay)
                        await m.reply(`✅ *Auto-Delete Enabled*\nDelay: ${delay/1000} seconds`)
                    } else if (action === 'off') {
                        await Group.updateSetting(groupId, 'autoDelete', false)
                        await m.reply('❌ *Auto-Delete Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off [delay_ms]')
                    }
                    break

                case 'logging':
                    if (action === 'on') {
                        const logGroup = options[0] || ''
                        await Group.setLogging(groupId, true, logGroup)
                        await m.reply(`✅ *Logging Enabled*\nLog Group: ${logGroup || 'Not set'}`)
                    } else if (action === 'off') {
                        await Group.setLogging(groupId, false)
                        await m.reply('❌ *Logging Disabled*')
                    } else {
                        await m.reply('❌ *Invalid Action*\nUse: on/off [log_group_id]')
                    }
                    break

                default:
                    await m.reply(`❌ *Unknown Feature*\nAvailable features: welcome, goodbye, antispam, antilink, antitoxic, antimedia, autodelete, logging`)
            }

        } catch (error) {
            console.error('Group settings error:', error)
            await m.reply('❌ *Error*\nFailed to update group settings. Please try again.')
        }
    }
}

export default handler