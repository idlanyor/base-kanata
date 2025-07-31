import Database from '../../helper/database.js'

// Default group settings
const defaultSettings = {
    // Basic settings
    name: '',
    description: '',
    welcome: false,
    goodbye: false,
    welcomeMessage: 'Selamat datang @user di grup @group!',
    goodbyeMessage: 'Selamat tinggal @user dari grup @group!',
    
    // Anti-spam settings
    antiSpam: false,
    spamThreshold: 5,
    spamTimeWindow: 10000, // 10 seconds
    spamAction: 'warn', // warn, kick, ban
    
    // Anti-link settings
    antiLink: false,
    whitelistLinks: ['youtube.com', 'youtu.be', 'facebook.com', 'instagram.com', 'tiktok.com'],
    linkAction: 'warn', // warn, kick, ban
    
    // Anti-promote settings
    antiPromote: false,
    promoteAction: 'warn', // warn, kick, ban
    
    // Anti-toxic settings
    antiToxic: false,
    toxicWords: ['anjing', 'bangsat', 'kontol', 'memek', 'babi', 'asu'],
    toxicAction: 'warn', // warn, kick, ban
    
    // Anti-media settings
    antiMedia: false,
    mediaTypes: ['image', 'video', 'audio', 'document'],
    mediaAction: 'warn', // warn, kick, ban
    
    // Auto-delete settings
    autoDelete: false,
    deleteCommands: true,
    deleteCommandsDelay: 30000, // 30 seconds
    
    // Member management
    maxMembers: 0, // 0 = unlimited
    autoKickInactive: false,
    inactiveDays: 30,
    
    // Admin settings
    onlyAdmin: false,
    adminCommands: ['kick', 'ban', 'promote', 'demote'],
    
    // Logging
    enableLogs: false,
    logGroup: '',
    
    // Custom commands
    customCommands: {},
    
    // Statistics
    stats: {
        messages: 0,
        commands: 0,
        kicks: 0,
        bans: 0,
        warnings: 0
    },
    
    // Member tracking
    members: [],
    bannedMembers: [],
    warnedMembers: {},
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
}

class Group {
    static async getSettings(groupId) {
        const db = await Database.connect()
        if (!db.data.groups[groupId]) {
            db.data.groups[groupId] = { ...defaultSettings }
            await db.write()
        }
        return db.data.groups[groupId]
    }

    static async updateSetting(groupId, feature, value) {
        const db = await Database.connect()
        if (!db.data.groups[groupId]) {
            db.data.groups[groupId] = { ...defaultSettings }
        }
        
        // Handle nested updates
        if (feature.includes('.')) {
            const keys = feature.split('.')
            let current = db.data.groups[groupId]
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}
                current = current[keys[i]]
            }
            current[keys[keys.length - 1]] = value
        } else {
            db.data.groups[groupId][feature] = value
        }
        
        db.data.groups[groupId].updatedAt = new Date().toISOString()
        await db.write()
        return db.data.groups[groupId]
    }

    // Welcome/Goodbye management
    static async setWelcome(groupId, enabled, message = null) {
        const settings = await this.getSettings(groupId)
        await this.updateSetting(groupId, 'welcome', enabled)
        if (message) {
            await this.updateSetting(groupId, 'welcomeMessage', message)
        }
        return settings
    }

    static async setGoodbye(groupId, enabled, message = null) {
        const settings = await this.getSettings(groupId)
        await this.updateSetting(groupId, 'goodbye', enabled)
        if (message) {
            await this.updateSetting(groupId, 'goodbyeMessage', message)
        }
        return settings
    }

    // Anti-spam management
    static async setAntiSpam(groupId, enabled, threshold = 5, action = 'warn') {
        await this.updateSetting(groupId, 'antiSpam', enabled)
        await this.updateSetting(groupId, 'spamThreshold', threshold)
        await this.updateSetting(groupId, 'spamAction', action)
        return await this.getSettings(groupId)
    }

    // Anti-link management
    static async setAntiLink(groupId, enabled, action = 'warn', whitelist = []) {
        await this.updateSetting(groupId, 'antiLink', enabled)
        await this.updateSetting(groupId, 'linkAction', action)
        if (whitelist.length > 0) {
            await this.updateSetting(groupId, 'whitelistLinks', whitelist)
        }
        return await this.getSettings(groupId)
    }

    // Anti-promote management
    static async setAntiPromote(groupId, enabled, action = 'warn') {
        await this.updateSetting(groupId, 'antiPromote', enabled)
        await this.updateSetting(groupId, 'promoteAction', action)
        return await this.getSettings(groupId)
    }

    // Anti-toxic management
    static async setAntiToxic(groupId, enabled, words = [], action = 'warn') {
        await this.updateSetting(groupId, 'antiToxic', enabled)
        await this.updateSetting(groupId, 'toxicAction', action)
        if (words.length > 0) {
            await this.updateSetting(groupId, 'toxicWords', words)
        }
        return await this.getSettings(groupId)
    }

    // Anti-media management
    static async setAntiMedia(groupId, enabled, types = [], action = 'warn') {
        await this.updateSetting(groupId, 'antiMedia', enabled)
        await this.updateSetting(groupId, 'mediaAction', action)
        if (types.length > 0) {
            await this.updateSetting(groupId, 'mediaTypes', types)
        }
        return await this.getSettings(groupId)
    }

    // Member management
    static async addMember(groupId, memberId, memberInfo = {}) {
        const settings = await this.getSettings(groupId)
        const existingMember = settings.members.find(m => m.id === memberId)
        
        if (!existingMember) {
            settings.members.push({
                id: memberId,
                name: memberInfo.name || '',
                joinDate: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                ...memberInfo
            })
            await this.updateSetting(groupId, 'members', settings.members)
        }
        
        return settings
    }

    static async removeMember(groupId, memberId) {
        const settings = await this.getSettings(groupId)
        settings.members = settings.members.filter(m => m.id !== memberId)
        await this.updateSetting(groupId, 'members', settings.members)
        return settings
    }

    static async banMember(groupId, memberId, reason = '') {
        const settings = await this.getSettings(groupId)
        const bannedMember = {
            id: memberId,
            bannedAt: new Date().toISOString(),
            reason: reason
        }
        
        settings.bannedMembers.push(bannedMember)
        await this.updateSetting(groupId, 'bannedMembers', settings.bannedMembers)
        
        // Update stats
        settings.stats.bans++
        await this.updateSetting(groupId, 'stats', settings.stats)
        
        return settings
    }

    static async unbanMember(groupId, memberId) {
        const settings = await this.getSettings(groupId)
        settings.bannedMembers = settings.bannedMembers.filter(m => m.id !== memberId)
        await this.updateSetting(groupId, 'bannedMembers', settings.bannedMembers)
        return settings
    }

    static async warnMember(groupId, memberId, reason = '') {
        const settings = await this.getSettings(groupId)
        const warning = {
            id: memberId,
            warnedAt: new Date().toISOString(),
            reason: reason
        }
        
        if (!settings.warnedMembers[memberId]) {
            settings.warnedMembers[memberId] = []
        }
        settings.warnedMembers[memberId].push(warning)
        
        await this.updateSetting(groupId, 'warnedMembers', settings.warnedMembers)
        
        // Update stats
        settings.stats.warnings++
        await this.updateSetting(groupId, 'stats', settings.stats)
        
        return settings
    }

    static async getMemberWarnings(groupId, memberId) {
        const settings = await this.getSettings(groupId)
        return settings.warnedMembers[memberId] || []
    }

    static async clearMemberWarnings(groupId, memberId) {
        const settings = await this.getSettings(groupId)
        delete settings.warnedMembers[memberId]
        await this.updateSetting(groupId, 'warnedMembers', settings.warnedMembers)
        return settings
    }

    // Statistics
    static async incrementStat(groupId, statType) {
        const settings = await this.getSettings(groupId)
        if (settings.stats[statType] !== undefined) {
            settings.stats[statType]++
            await this.updateSetting(groupId, 'stats', settings.stats)
        }
        return settings
    }

    // Custom commands
    static async addCustomCommand(groupId, command, response) {
        const settings = await this.getSettings(groupId)
        settings.customCommands[command] = response
        await this.updateSetting(groupId, 'customCommands', settings.customCommands)
        return settings
    }

    static async removeCustomCommand(groupId, command) {
        const settings = await this.getSettings(groupId)
        delete settings.customCommands[command]
        await this.updateSetting(groupId, 'customCommands', settings.customCommands)
        return settings
    }

    // Logging
    static async setLogging(groupId, enabled, logGroup = '') {
        await this.updateSetting(groupId, 'enableLogs', enabled)
        if (logGroup) {
            await this.updateSetting(groupId, 'logGroup', logGroup)
        }
        return await this.getSettings(groupId)
    }

    // Utility methods
    static async isMemberBanned(groupId, memberId) {
        const settings = await this.getSettings(groupId)
        return settings.bannedMembers.some(m => m.id === memberId)
    }

    static async getMemberWarningsCount(groupId, memberId) {
        const warnings = await this.getMemberWarnings(groupId, memberId)
        return warnings.length
    }

    static async shouldTakeAction(groupId, memberId, actionType) {
        const warnings = await this.getMemberWarningsCount(groupId, memberId)
        const settings = await this.getSettings(groupId)
        
        // Check if member is banned
        if (await this.isMemberBanned(groupId, memberId)) {
            return { action: 'ban', reason: 'Member is banned' }
        }
        
        // Check warning threshold based on action type
        const thresholds = {
            'spam': 3,
            'link': 2,
            'promote': 1,
            'toxic': 2,
            'media': 2
        }
        
        const threshold = thresholds[actionType] || 3
        if (warnings >= threshold) {
            return { action: settings[`${actionType}Action`], reason: `Too many ${actionType} violations` }
        }
        
        return { action: 'warn', reason: `${actionType} violation` }
    }

    // Search and list methods
    static async searchGroups(query) {
        const db = await Database.connect()
        const groups = Object.entries(db.data.groups)
        
        return groups
            .filter(([id, group]) => 
                group.name.toLowerCase().includes(query.toLowerCase()) ||
                id.includes(query)
            )
            .map(([id, group]) => ({ id, ...group }))
    }

    static async getAllGroups() {
        const db = await Database.connect()
        return Object.entries(db.data.groups).map(([id, group]) => ({ id, ...group }))
    }
}

export default Group 