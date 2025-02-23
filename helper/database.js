import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbFolder = join(__dirname, '../database')
const dbFile = join(dbFolder, 'db.json')

// Struktur default database
const defaultData = {
  users: {},
  groups: {},
  stats: {
    commands: 0,
    messages: 0
  },
  settings: {
    owner: [],
    botMode: 'public',
    autoAI: false,
    prefix: '!'
  }
}

// Buat folder database jika belum ada
async function initDatabase() {
  try {
    // Cek apakah folder database sudah ada
    try {
      await fs.access(dbFolder)
    } catch {
      // Jika belum ada, buat folder database
      await fs.mkdir(dbFolder, { recursive: true })
    }

    // Cek apakah file db.json sudah ada
    try {
      await fs.access(dbFile)
    } catch {
      // Jika belum ada, buat file db.json dengan data default
      await fs.writeFile(dbFile, JSON.stringify(defaultData, null, 2))
    }
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Inisialisasi database
await initDatabase()
const adapter = new JSONFile(dbFile)
const db = new Low(adapter, defaultData)

// Load database
try {
  await db.read()
  // Pastikan struktur data sesuai dengan default
  db.data = {
    ...defaultData,
    ...db.data
  }
  await db.write()
} catch (error) {
  console.error('Error loading database:', error)
  // Jika terjadi error, gunakan data default
  db.data = defaultData
}

const Database = {
  // User methods
  async getUser(jid) {
    try {
      if (!db.data.users[jid]) {
        db.data.users[jid] = {
          name: '',
          number: jid.split('@')[0],
          registered: false,
          banned: false,
          warnings: 0,
          lastChat: Date.now()
        }
        await db.write()
      }
      return db.data.users[jid]
    } catch (error) {
      console.error('Error in getUser:', error)
      return null
    }
  },

  // Group methods  
  async getGroup(id) {
    try {
      if (!db.data.groups[id]) {
        db.data.groups[id] = {
          name: '',
          members: [],
          welcome: true,
          antiSpam: false,
          antiPromote: false,
          antiLink: false,
          antiToxic: false
        }
        await db.write()
      }
      return db.data.groups[id]
    } catch (error) {
      console.error('Error in getGroup:', error)
      return null
    }
  },

  // Update methods
  async updateUser(jid, data) {
    try {
      db.data.users[jid] = {
        ...db.data.users[jid],
        ...data
      }
      await db.write()
      return db.data.users[jid]
    } catch (error) {
      console.error('Error in updateUser:', error)
      return null
    }
  },

  async updateGroup(id, data) {
    try {
      db.data.groups[id] = {
        ...db.data.groups[id], 
        ...data
      }
      await db.write()
      return db.data.groups[id]
    } catch (error) {
      console.error('Error in updateGroup:', error)
      return null
    }
  },

  // Stats methods
  async addCommand() {
    try {
      db.data.stats.commands++
      await db.write()
    } catch (error) {
      console.error('Error in addCommand:', error)
    }
  },

  async addMessage() {
    try {
      db.data.stats.messages++
      await db.write()
    } catch (error) {
      console.error('Error in addMessage:', error)
    }
  },

  // Settings methods yang diperbarui
  async getSettings() {
    try {
      // Pastikan semua field settings ada
      if (!db.data.settings) {
        db.data.settings = defaultData.settings
      }

      // Pastikan field botMode ada
      if (!db.data.settings.hasOwnProperty('botMode')) {
        db.data.settings.botMode = 'public'
      }

      // Pastikan field autoAI ada
      if (!db.data.settings.hasOwnProperty('autoAI')) {
        db.data.settings.autoAI = false
      }

      // Pastikan field prefix ada
      if (!db.data.settings.hasOwnProperty('prefix')) {
        db.data.settings.prefix = '!'
      }

      await db.write()
      return db.data.settings
    } catch (error) {
      console.error('Error in getSettings:', error)
      return defaultData.settings
    }
  },

  async updateSettings(data) {
    try {
      // Validasi mode bot
      if (data.botMode && !['public', 'self-private', 'self-me'].includes(data.botMode)) {
        throw new Error('Invalid bot mode')
      }

      db.data.settings = {
        ...db.data.settings,
        ...data
      }
      await db.write()

      return db.data.settings
    } catch (error) {
      console.error('Error in updateSettings:', error)
      return null
    }
  },

  // Helper methods untuk mode bot
  async getBotMode() {
    try {
      const settings = await this.getSettings()
      return settings.botMode || 'public'
    } catch (error) {
      console.error('Error in getBotMode:', error)
      return 'public' // Default fallback
    }
  },

  async setBotMode(mode) {
    try {
      if (!['public', 'self-private', 'self-me'].includes(mode)) {
        throw new Error('Invalid bot mode')
      }

      await this.updateSettings({ botMode: mode })
      return true
    } catch (error) {
      console.error('Error in setBotMode:', error)
      return false
    }
  },

  // Method untuk mengecek apakah pesan diizinkan berdasarkan mode
  async isMessageAllowed(isGroup, isOwner) {
    try {
      const mode = await this.getBotMode()
      
      switch (mode) {
        case 'public':
          return true
        case 'self-private':
          return !isGroup || isOwner
        case 'self-me':
          return isOwner
        default:
          return false
      }
    } catch (error) {
      console.error('Error in isMessageAllowed:', error)
      return false
    }
  }
}

export default Database 