import Database from '../../helper/database.js'

const defaultSettings = {
    antilink: false,
    welcome: false,
    goodbye: false,
    antispam: false,
    antitoxic: false,
    antipromosi: false,
    only_admin: false
}

class Group {
    static async getSettings(groupId) {
        const db = await Database.connect()
        if (!db.data.groups[groupId]) {
            db.data.groups[groupId] = defaultSettings
            await db.write()
        }
        return db.data.groups[groupId]
    }

    static async updateSetting(groupId, feature, value) {
        const db = await Database.connect()
        if (!db.data.groups[groupId]) {
            db.data.groups[groupId] = defaultSettings
        }
        db.data.groups[groupId][feature] = value
        await db.write()
        return db.data.groups[groupId]
    }
}

export default Group 